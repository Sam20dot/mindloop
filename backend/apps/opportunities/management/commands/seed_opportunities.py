from django.core.management.base import BaseCommand
from apps.opportunities.models import Opportunity


OPPORTUNITIES = [
    # ── Freelance ──────────────────────────────────────────────────────────
    {
        'title': 'Python Automation Script Developer',
        'type': 'freelance',
        'skill_tags': ['python', 'automation', 'scripting'],
        'description': (
            'Clients on Fiverr and Upwork need Python scripts to automate repetitive tasks '
            'like data processing, web scraping, and file management. '
            'Great entry point for Python developers with basic scripting skills.'
        ),
        'source_url': 'https://www.fiverr.com/categories/programming-tech/python',
    },
    {
        'title': 'WordPress Website Developer',
        'type': 'freelance',
        'skill_tags': ['wordpress', 'web development', 'html', 'css'],
        'description': (
            'Build and customize WordPress websites for small businesses and bloggers. '
            'Projects include theme customization, plugin setup, and landing page design. '
            'High demand on Upwork and Fiverr with steady repeat clients.'
        ),
        'source_url': 'https://www.upwork.com/freelance-jobs/wordpress/',
    },
    {
        'title': 'Data Entry and Spreadsheet Specialist',
        'type': 'freelance',
        'skill_tags': ['excel', 'google sheets', 'data entry', 'spreadsheets'],
        'description': (
            'Help businesses organize, clean, and manage data in Excel or Google Sheets. '
            'Tasks include data formatting, formula creation, and dashboard building. '
            'Beginner-friendly with consistent availability on Fiverr.'
        ),
        'source_url': 'https://www.fiverr.com/categories/business/data-entry-freelancers',
    },
    {
        'title': 'Social Media Content Writer',
        'type': 'freelance',
        'skill_tags': ['content writing', 'social media', 'copywriting'],
        'description': (
            'Write engaging captions, posts, and short-form content for brands on Instagram, '
            'Twitter, LinkedIn, and TikTok. Clients need 10–30 posts per month. '
            'Perfect for strong writers who understand social media trends.'
        ),
        'source_url': 'https://www.upwork.com/freelance-jobs/social-media/',
    },
    {
        'title': 'Logo and Brand Identity Designer (Canva)',
        'type': 'freelance',
        'skill_tags': ['canva', 'graphic design', 'branding', 'logo design'],
        'description': (
            'Create logos, brand kits, and social media templates using Canva or Adobe tools. '
            'Small businesses and startups frequently hire for quick turnaround design projects. '
            'Build a portfolio fast with beginner-level design tools.'
        ),
        'source_url': 'https://www.fiverr.com/categories/graphics-design/logo-design',
    },
    {
        'title': 'Virtual Assistant (Remote)',
        'type': 'freelance',
        'skill_tags': ['communication', 'organization', 'email management', 'scheduling'],
        'description': (
            'Support entrepreneurs and executives with email management, calendar scheduling, '
            'research tasks, and basic admin work. No advanced technical skills required. '
            'One of the highest-demand freelance categories globally.'
        ),
        'source_url': 'https://www.upwork.com/freelance-jobs/virtual-assistant/',
    },
    {
        'title': 'Freelance Translator (English / French / Swahili)',
        'type': 'freelance',
        'skill_tags': ['translation', 'languages', 'writing'],
        'description': (
            'Translate documents, websites, and marketing materials between languages. '
            'African language translators are especially in demand on platforms like Upwork. '
            'Flexible hours with project-based pay.'
        ),
        'source_url': 'https://www.upwork.com/freelance-jobs/translation/',
    },
    {
        'title': 'Video Editor (CapCut / DaVinci Resolve)',
        'type': 'freelance',
        'skill_tags': ['video editing', 'capcut', 'davinci resolve', 'content creation'],
        'description': (
            'Edit short-form videos for YouTube creators, TikTok brands, and online coaches. '
            'Skills include cutting, transitions, subtitles, and basic colour grading. '
            'High demand as video content continues to dominate social media.'
        ),
        'source_url': 'https://www.fiverr.com/categories/video-animation/video-editing',
    },
    # ── Internships ────────────────────────────────────────────────────────
    {
        'title': 'Software Developer Intern (Remote)',
        'type': 'internship',
        'skill_tags': ['python', 'javascript', 'web development', 'git'],
        'description': (
            'Join a remote tech startup as a software developer intern. '
            'Work on real features, fix bugs, and contribute to production codebases. '
            'Great for students with basic programming knowledge looking for hands-on experience.'
        ),
        'source_url': 'https://remote.co/remote-jobs/developer/',
    },
    {
        'title': 'Data Analyst Intern (Remote)',
        'type': 'internship',
        'skill_tags': ['python', 'sql', 'data analysis', 'excel', 'tableau'],
        'description': (
            'Assist the data team with cleaning datasets, building reports, and creating dashboards. '
            'Use tools like Python, SQL, and Tableau to drive business insights. '
            'Available on Internshala, LinkedIn, and Remote.co.'
        ),
        'source_url': 'https://internshala.com/internships/data-science-internship/',
    },
    {
        'title': 'Digital Marketing Intern (Remote)',
        'type': 'internship',
        'skill_tags': ['digital marketing', 'seo', 'social media', 'google analytics'],
        'description': (
            'Help plan and execute digital marketing campaigns across social media and email. '
            'Learn SEO, paid ads, and analytics while working with a real marketing team. '
            'Listed regularly on LinkedIn and Internshala.'
        ),
        'source_url': 'https://www.linkedin.com/jobs/digital-marketing-internships/',
    },
    {
        'title': 'Content Writing Intern (Remote)',
        'type': 'internship',
        'skill_tags': ['content writing', 'blogging', 'seo', 'research'],
        'description': (
            'Write blog posts, product descriptions, and articles for an online publication or startup. '
            'Gain a byline, improve your writing skills, and build a published portfolio. '
            'Open to beginners with strong writing ability.'
        ),
        'source_url': 'https://internshala.com/internships/content-writing-internship/',
    },
    {
        'title': 'UI/UX Design Intern (Remote)',
        'type': 'internship',
        'skill_tags': ['figma', 'ui design', 'ux research', 'prototyping'],
        'description': (
            'Design wireframes, prototypes, and user interfaces for a product team. '
            'Work with Figma and collaborate with developers to build user-friendly features. '
            'Available on LinkedIn and Behance job boards.'
        ),
        'source_url': 'https://www.linkedin.com/jobs/ui-ux-design-internships/',
    },
    # ── Entry Level ────────────────────────────────────────────────────────
    {
        'title': 'Junior Web Developer',
        'type': 'entry-level',
        'skill_tags': ['html', 'css', 'javascript', 'react', 'web development'],
        'description': (
            'Build and maintain websites and web applications for clients or internal teams. '
            'Entry-level roles typically require knowledge of HTML, CSS, JavaScript, and one framework. '
            'Listed on LinkedIn, Indeed, and Remote.co.'
        ),
        'source_url': 'https://www.linkedin.com/jobs/junior-web-developer-jobs/',
    },
    {
        'title': 'Junior Data Analyst',
        'type': 'entry-level',
        'skill_tags': ['sql', 'python', 'excel', 'data analysis', 'visualization'],
        'description': (
            'Analyze business data to uncover trends and support decision-making. '
            'Work with SQL databases, Excel, and visualization tools like Power BI or Tableau. '
            'High demand across industries including finance, e-commerce, and healthcare.'
        ),
        'source_url': 'https://www.linkedin.com/jobs/junior-data-analyst-jobs/',
    },
    {
        'title': 'Customer Support Specialist (Remote)',
        'type': 'entry-level',
        'skill_tags': ['communication', 'customer service', 'problem solving', 'english'],
        'description': (
            'Respond to customer inquiries via chat, email, or phone for a global SaaS company. '
            'No coding required — strong communication and problem-solving skills are key. '
            'Fully remote with flexible shifts available.'
        ),
        'source_url': 'https://remote.co/remote-jobs/customer-service/',
    },
    {
        'title': 'Social Media Manager',
        'type': 'entry-level',
        'skill_tags': ['social media', 'content creation', 'canva', 'copywriting', 'analytics'],
        'description': (
            'Manage social media accounts for a brand or agency — creating content, scheduling posts, '
            'and tracking engagement metrics. Ideal for creative individuals who love online culture. '
            'Entry-level positions are common on LinkedIn and Indeed.'
        ),
        'source_url': 'https://www.linkedin.com/jobs/social-media-manager-jobs/',
    },
    {
        'title': 'Junior Copywriter',
        'type': 'entry-level',
        'skill_tags': ['copywriting', 'content writing', 'seo', 'marketing'],
        'description': (
            'Write persuasive copy for ads, landing pages, emails, and product descriptions. '
            'Work with marketing teams to craft messaging that converts. '
            'Remote-friendly with opportunities at agencies and SaaS companies.'
        ),
        'source_url': 'https://www.linkedin.com/jobs/junior-copywriter-jobs/',
    },
    {
        'title': 'IT Support Technician',
        'type': 'entry-level',
        'skill_tags': ['it support', 'networking', 'troubleshooting', 'windows', 'linux'],
        'description': (
            'Provide technical support for hardware, software, and network issues. '
            'Troubleshoot problems remotely or on-site for business users. '
            'Entry point into a career in IT and cybersecurity.'
        ),
        'source_url': 'https://www.linkedin.com/jobs/it-support-jobs/',
    },
    {
        'title': 'Junior Graphic Designer',
        'type': 'entry-level',
        'skill_tags': ['graphic design', 'adobe illustrator', 'photoshop', 'canva', 'branding'],
        'description': (
            'Design visual assets for brands including social graphics, marketing materials, and presentations. '
            'Work with Adobe Creative Suite or Canva in a creative team. '
            'Build a strong portfolio and grow into senior design roles.'
        ),
        'source_url': 'https://www.linkedin.com/jobs/junior-graphic-designer-jobs/',
    },
]


class Command(BaseCommand):
    help = 'Seed the database with curated career opportunities'

    def handle(self, *args, **options):
        created = 0
        skipped = 0

        for data in OPPORTUNITIES:
            obj, was_created = Opportunity.objects.get_or_create(
                title=data['title'],
                defaults={
                    'type': data['type'],
                    'skill_tags': data['skill_tags'],
                    'description': data['description'],
                    'source_url': data['source_url'],
                },
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Done. Created {created} opportunities, skipped {skipped} already existing.'
            )
        )
