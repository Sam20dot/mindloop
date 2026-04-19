import os
import re

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Material
from .serializers import MaterialSerializer, MaterialListSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_materials(request):
    materials = Material.objects.filter(user=request.user)
    return Response(MaterialListSerializer(materials, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_material(request, material_id):
    try:
        m = Material.objects.get(id=material_id, user=request.user)
    except Material.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(MaterialSerializer(m).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_material(request, material_id):
    try:
        m = Material.objects.get(id=material_id, user=request.user)
    except Material.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Remove file from disk if exists
    if m.file_path and os.path.exists(m.file_path):
        try:
            os.remove(m.file_path)
        except OSError:
            pass

    m.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, JSONParser])
def upload_material(request):
    upload_type = request.data.get('type', '').lower()

    if upload_type in ('url', 'youtube'):
        return _handle_url(request, upload_type)
    elif upload_type in ('pdf', 'docx', 'text', ''):
        return _handle_file(request)
    else:
        return Response({'error': 'Invalid type. Use: pdf, docx, text, url, youtube.'}, status=status.HTTP_400_BAD_REQUEST)


# ── Handlers ───────────────────────────────────────────────────

def _handle_url(request, url_type):
    url = request.data.get('url', '').strip()
    if not url:
        return Response({'error': 'url is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if url_type == 'youtube':
        video_id = _extract_youtube_id(url)
        title = request.data.get('title', '') or f'YouTube: {video_id or url[:60]}'
        content_text = f'YouTube video: {url}\nVideo ID: {video_id or "unknown"}'
        m = Material.objects.create(
            user=request.user, title=title, type='youtube',
            content_text=content_text, source_url=url,
        )
        _award_library_points(request.user)
        return Response(MaterialSerializer(m).data, status=status.HTTP_201_CREATED)

    # Regular URL — scrape
    try:
        content_text, title = _scrape_url(url)
    except Exception as e:
        return Response({'error': f'Failed to scrape URL: {str(e)}'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    title = request.data.get('title', '') or title or url[:80]
    m = Material.objects.create(
        user=request.user, title=title, type='url',
        content_text=content_text[:50000], source_url=url,
    )
    _award_library_points(request.user)
    return Response(MaterialSerializer(m).data, status=status.HTTP_201_CREATED)


def _handle_file(request):
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

    filename = file.name.lower()
    title = request.data.get('title', '') or file.name

    if filename.endswith('.txt'):
        try:
            content_text = file.read().decode('utf-8')
        except UnicodeDecodeError:
            content_text = file.read().decode('latin-1')
        m = Material.objects.create(user=request.user, title=title, type='text', content_text=content_text[:50000])
        _award_library_points(request.user)
        return Response(MaterialSerializer(m).data, status=status.HTTP_201_CREATED)

    if filename.endswith('.pdf'):
        try:
            content_text = _extract_pdf(file)
        except Exception as e:
            return Response({'error': f'PDF extraction failed: {str(e)}'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        m = Material.objects.create(user=request.user, title=title, type='pdf', content_text=content_text[:50000])
        _award_library_points(request.user)
        return Response(MaterialSerializer(m).data, status=status.HTTP_201_CREATED)

    if filename.endswith('.docx'):
        try:
            content_text = _extract_docx(file)
        except Exception as e:
            return Response({'error': f'DOCX extraction failed: {str(e)}'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        m = Material.objects.create(user=request.user, title=title, type='docx', content_text=content_text[:50000])
        _award_library_points(request.user)
        return Response(MaterialSerializer(m).data, status=status.HTTP_201_CREATED)

    return Response({'error': 'Unsupported file type. Use .pdf, .docx, or .txt'}, status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)


# ── Extractors ─────────────────────────────────────────────────

def _extract_pdf(file) -> str:
    import pdfplumber
    import io
    with pdfplumber.open(io.BytesIO(file.read())) as pdf:
        pages = [page.extract_text() or '' for page in pdf.pages]
    text = '\n\n'.join(p.strip() for p in pages if p.strip())
    if not text:
        raise ValueError('No extractable text found in PDF.')
    return text


def _extract_docx(file) -> str:
    import docx
    import io
    doc = docx.Document(io.BytesIO(file.read()))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    text = '\n'.join(paragraphs)
    if not text:
        raise ValueError('No extractable text found in DOCX.')
    return text


def _scrape_url(url: str):
    import requests
    from bs4 import BeautifulSoup
    resp = requests.get(url, timeout=15, headers={'User-Agent': 'Mozilla/5.0'})
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, 'html.parser')
    title = soup.title.string.strip() if soup.title and soup.title.string else ''
    for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
        tag.decompose()
    text = soup.get_text(separator='\n', strip=True)
    return text, title


def _extract_youtube_id(url: str) -> str:
    patterns = [
        r'(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})',
        r'(?:embed/)([A-Za-z0-9_-]{11})',
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return ''


def _award_library_points(user):
    user.points += 10
    user.save(update_fields=['points'])
    user.update_level()
