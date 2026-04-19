from django.core.paginator import Paginator
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Post, PostLike
from .serializers import PostSerializer

PAGE_SIZE = 10


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def community_feed(request):
    page_num = max(1, int(request.GET.get('page', 1)))
    posts = Post.objects.select_related('user').prefetch_related('likes')
    paginator = Paginator(posts, PAGE_SIZE)
    page = paginator.get_page(page_num)

    return Response({
        'results': PostSerializer(page.object_list, many=True, context={'request': request}).data,
        'count': paginator.count,
        'next': page_num + 1 if page.has_next() else None,
        'previous': page_num - 1 if page.has_previous() else None,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    content = request.data.get('content', '').strip()
    post_type = request.data.get('type', 'learning_update')

    if not content:
        return Response({'error': 'Content is required.'}, status=status.HTTP_400_BAD_REQUEST)

    valid_types = [c[0] for c in Post.TYPE_CHOICES]
    if post_type not in valid_types:
        post_type = 'learning_update'

    post = Post.objects.create(user=request.user, type=post_type, content=content)
    return Response(PostSerializer(post, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def like_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        PostLike.objects.get_or_create(user=request.user, post=post)
    else:
        PostLike.objects.filter(user=request.user, post=post).delete()

    post.refresh_from_db()
    return Response({'liked': request.method == 'POST', 'like_count': post.likes.count()})
