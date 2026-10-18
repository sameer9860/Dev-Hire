"""
AI Career Coach Engine for DevHire
====================================
Analyzes a developer's profile against real job market demands,
identifies skill gaps, and generates a personalized 30/60-day
learning roadmap with concrete, actionable tasks.

Public API:
  generate_career_roadmap(user_profile, target_role, duration_days, job_samples, api_key="") -> dict
"""

import json
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = (
    "You are an expert software engineering career coach specializing in helping junior and mid-level "
    "developers break into their target roles. Your task is to analyze a developer's current profile "
    "and generate a highly practical, personalized career roadmap.\n\n"
    "Guidelines:\n"
    "1. Identify 3-6 specific skill gaps between the developer's current skills and the target role requirements.\n"
    "2. Generate a structured roadmap with concrete weekly tasks that a developer can act on immediately.\n"
    "3. Each task should have: a title, short description, category (learn/build/practice/read/apply), "
    "an optional free resource URL, and the week number it belongs to.\n"
    "4. Tasks should be realistic for a working developer (no more than 8-10 tasks per week).\n"
    "5. Recommend at least 1-2 portfolio projects that demonstrate the missing skills.\n"
    "6. Every single week across the roadmap duration must have completely UNIQUE, PROGRESSIVE tasks. NEVER repeat tasks or milestones from earlier weeks.\n"
    "7. Write a short 2-3 sentence personalized summary for the developer.\n"
    "8. Return ONLY valid JSON matching the schema below — no markdown, no extra text.\n"
    "Schema:\n"
    "{\n"
    '  "summary": "<2-3 sentence personalized analysis and encouragement>",\n'
    '  "skill_gaps": ["<gap1>", "<gap2>", ...],\n'
    '  "tasks": [\n'
    '    {\n'
    '      "title": "<action-oriented task title>",\n'
    '      "description": "<1-2 sentence description>",\n'
    '      "category": "<learn|build|practice|read|apply>",\n'
    '      "resource_url": "<optional direct link to free resource>",\n'
    '      "week": <week_number_int>\n'
    "    }\n"
    "  ]\n"
    "}"
)

PROMPT_TEMPLATE = """Developer Profile:
- Name: {name}
- Headline: {headline}
- Current Skills: {skills}
- Projects Built: {projects}
- Work Experience: {experience}
- Bio: {bio}

Target Role: {target_role}
Roadmap Duration: {duration_days} days ({num_weeks} weeks)

Top Job Market Requirements for "{target_role}" (from real listings):
{job_samples}

Analyze this developer's profile, identify what skills they are missing for the target role,
and generate a structured {duration_days}-day learning roadmap with 2-3 specific weekly tasks for EACH of the {num_weeks} weeks.
Every single week from Week 1 to Week {num_weeks} MUST be progressive and distinct. Do NOT repeat tasks from earlier weeks.
Focus on skills the developer DOES NOT already have. Be practical and encouraging.

Return JSON following the schema exactly.
"""


# ── Fallback data: curated roadmaps for common target roles ──────────────────

COMMON_ROADMAPS: Dict[str, Dict[str, Any]] = {
    "junior django developer": {
        "skill_gaps": ["Django REST Framework", "PostgreSQL", "Docker", "JWT Authentication", "Pytest", "Redis Caching", "Celery"],
        "tasks_per_week": [
            [
                {"title": "Master Django Models & the ORM", "description": "Work through Django models, field types, relationships (ForeignKey, ManyToMany), and database migrations.", "category": "learn", "resource_url": "https://docs.djangoproject.com/en/stable/topics/db/models/"},
                {"title": "Set up PostgreSQL locally", "description": "Install PostgreSQL, create a database, and connect it to your Django project using psycopg2.", "category": "practice", "resource_url": "https://www.postgresql.org/docs/current/tutorial.html"},
                {"title": "Build a modular CRUD application", "description": "Create a Django application with Class-Based Views (ListView, DetailView, CreateView) and URL routing.", "category": "build", "resource_url": "https://docs.djangoproject.com/en/stable/intro/tutorial01/"},
            ],
            [
                {"title": "Build a REST API with Django REST Framework", "description": "Create RESTful CRUD endpoints using DRF Serializers, ViewSets, and Routers.", "category": "learn", "resource_url": "https://www.django-rest-framework.org/tutorial/quickstart/"},
                {"title": "Implement JWT Authentication", "description": "Add access and refresh token-based authentication using djangorestframework-simplejwt.", "category": "learn", "resource_url": "https://django-rest-framework-simplejwt.readthedocs.io/"},
                {"title": "Add Custom Permission Classes", "description": "Secure endpoints with role-based permissions (e.g., IsOwnerOrReadOnly).", "category": "practice", "resource_url": "https://www.django-rest-framework.org/api-guide/permissions/"},
            ],
            [
                {"title": "Write unit & API tests with Pytest", "description": "Write automated tests for models and DRF API endpoints using pytest-django and APIClient.", "category": "practice", "resource_url": "https://pytest-django.readthedocs.io/en/latest/"},
                {"title": "Optimize ORM queries (select_related & prefetch_related)", "description": "Profile queries to eliminate N+1 query bottlenecks and add database indexes.", "category": "practice", "resource_url": "https://docs.djangoproject.com/en/stable/ref/models/querysets/"},
                {"title": "Generate interactive API documentation", "description": "Add OpenAPI/Swagger documentation using drf-spectacular for client developers.", "category": "build", "resource_url": "https://drf-spectacular.readthedocs.io/"},
            ],
            [
                {"title": "Containerize with Docker & Docker Compose", "description": "Write a multi-stage Dockerfile and docker-compose.yml running Django, PostgreSQL, and Redis.", "category": "build", "resource_url": "https://docs.docker.com/samples/django/"},
                {"title": "Build a complete Portfolio API project", "description": "Build an end-to-end API project (e.g. Job Board or E-commerce API) with auth, CRUD, tests, and Docker.", "category": "build", "resource_url": ""},
                {"title": "Deploy to Railway or Render", "description": "Deploy your containerized project to a live cloud platform and verify live production endpoints.", "category": "apply", "resource_url": "https://railway.app/"},
            ],
            [
                {"title": "Integrate Redis for High-Performance Caching", "description": "Configure django-redis to cache heavy database queries and expensive API responses.", "category": "learn", "resource_url": "https://github.com/jazzband/django-redis"},
                {"title": "Implement API Rate Limiting & Throttling", "description": "Protect public endpoints against abuse with DRF AnonRateThrottle and UserRateThrottle.", "category": "practice", "resource_url": "https://www.django-rest-framework.org/api-guide/throttling/"},
                {"title": "Benchmark API response times", "description": "Use load-testing tools or Apache Bench to compare cached vs. uncached endpoints.", "category": "practice", "resource_url": ""},
            ],
            [
                {"title": "Set up Celery with Redis broker", "description": "Configure Celery in your Django project to handle asynchronous background tasks.", "category": "learn", "resource_url": "https://docs.celeryq.dev/en/stable/django/first-steps-with-django.html"},
                {"title": "Implement background email & report generation", "description": "Offload notification emails and CSV/PDF report generation to background Celery workers.", "category": "build", "resource_url": ""},
                {"title": "Schedule periodic tasks with Celery Beat", "description": "Create automated cron-like scheduled jobs for periodic database maintenance.", "category": "practice", "resource_url": ""},
            ],
            [
                {"title": "Automate CI/CD with GitHub Actions", "description": "Create a GitHub Actions workflow that runs Ruff linting, black formatting, and pytest on push.", "category": "build", "resource_url": "https://docs.github.com/en/actions"},
                {"title": "Security audit & OWASP hardening", "description": "Audit security headers, CORS origins, cookie security flags, and run python -m manage check --deploy.", "category": "practice", "resource_url": "https://docs.djangoproject.com/en/stable/howto/deployment/checklist/"},
                {"title": "Integrate Sentry error tracking", "description": "Add sentry-sdk to capture uncaught exceptions and performance bottlenecks in production.", "category": "build", "resource_url": "https://sentry.io/"},
            ],
            [
                {"title": "Ship Full-Stack integration or frontend client", "description": "Connect your Django REST backend to a Next.js or React frontend to demonstrate full-stack flow.", "category": "build", "resource_url": ""},
                {"title": "Write a professional project README", "description": "Document architectural decisions, API schema diagrams, environment setup, and test instructions.", "category": "read", "resource_url": ""},
                {"title": "Apply to 5 Django Developer positions", "description": "Use your newly deployed projects and updated DevHire profile to apply to matching roles.", "category": "apply", "resource_url": ""},
            ],
            [
                {"title": "Explore Django Signals & Custom Middleware", "description": "Build custom middleware for request timing and audit logging.", "category": "learn", "resource_url": "https://docs.djangoproject.com/en/stable/topics/http/middleware/"},
                {"title": "Database transactions & race conditions", "description": "Master select_for_update() and transaction.atomic() for consistent financial/booking states.", "category": "practice", "resource_url": ""},
            ],
            [
                {"title": "WebSockets with Django Channels", "description": "Implement real-time messaging or live notifications with Django Channels and ASGI.", "category": "build", "resource_url": "https://channels.readthedocs.io/"},
                {"title": "Stress test WebSocket connections", "description": "Verify connection stability under concurrent user connections.", "category": "practice", "resource_url": ""},
            ],
            [
                {"title": "Open Source contribution to Python/Django package", "description": "Find an open issue or documentation typo in an active Django ecosystem library and submit a PR.", "category": "apply", "resource_url": "https://goodfirstissue.dev/"},
                {"title": "System design practice for backend APIs", "description": "Practice designing scalable backend systems (load balancers, read replicas, caching).", "category": "read", "resource_url": ""},
            ],
            [
                {"title": "Final Portfolio polish & resume tailoring", "description": "Ensure all GitHub repos have live demos, CI badges, and clear documentation.", "category": "build", "resource_url": ""},
                {"title": "Targeted job applications & interview prep", "description": "Apply to senior and mid-level roles and practice technical Python/Django interview questions.", "category": "apply", "resource_url": ""},
            ],
        ],
    },
    "full-stack developer": {
        "skill_gaps": ["React", "TypeScript", "REST API Integration", "Git & CI/CD", "Docker", "PostgreSQL", "Tailwind CSS"],
        "tasks_per_week": [
            [
                {"title": "Master React Fundamentals & Hooks", "description": "Complete hands-on exercises covering useState, useEffect, useRef, and custom hooks.", "category": "learn", "resource_url": "https://react.dev/learn"},
                {"title": "TypeScript Crash Course", "description": "Learn TypeScript core types, interfaces, generics, and convert a JS component to strict TS.", "category": "learn", "resource_url": "https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html"},
                {"title": "Build a responsive UI with modern CSS/Tailwind", "description": "Create reusable UI component primitives (Button, Card, Input, Modal) with responsive design.", "category": "build", "resource_url": ""},
            ],
            [
                {"title": "Design RESTful backend API routes", "description": "Create structured backend endpoints with validation, semantic HTTP status codes, and error formatting.", "category": "learn", "resource_url": "https://restfulapi.net/"},
                {"title": "Set up PostgreSQL database schema", "description": "Design relational models with foreign keys, indexes, and automated migrations.", "category": "practice", "resource_url": "https://www.postgresql.org/docs/current/"},
                {"title": "Implement JWT user authentication", "description": "Build user registration, password hashing, and token authentication with refresh tokens.", "category": "build", "resource_url": ""},
            ],
            [
                {"title": "Client-side data fetching with React Query", "description": "Implement caching, automatic retries, and optimistic UI updates using TanStack Query.", "category": "learn", "resource_url": "https://tanstack.com/query/latest"},
                {"title": "Form validation with React Hook Form & Zod", "description": "Build complex forms with schema-driven validation and real-time client errors.", "category": "practice", "resource_url": "https://react-hook-form.com/"},
                {"title": "Connect frontend to backend APIs", "description": "Wire client forms and dashboards to live backend endpoints with auth headers.", "category": "build", "resource_url": ""},
            ],
            [
                {"title": "Set up CI/CD with GitHub Actions", "description": "Add automated workflows that run lint, type-check, and tests on every commit.", "category": "build", "resource_url": "https://docs.github.com/en/actions"},
                {"title": "Containerize full-stack app with Docker", "description": "Write a docker-compose.yml running frontend, backend, and PostgreSQL database.", "category": "build", "resource_url": "https://docs.docker.com/"},
                {"title": "Deploy full-stack app to production", "description": "Deploy frontend to Vercel and backend to Railway/Render with production database and SSL.", "category": "apply", "resource_url": "https://vercel.com/docs"},
            ],
            [
                {"title": "Automated frontend & backend testing", "description": "Write component tests with Vitest/RTL and integration tests for backend API routes.", "category": "practice", "resource_url": "https://testing-library.com/"},
                {"title": "Web accessibility (a11y) audit", "description": "Ensure full keyboard navigation, correct ARIA roles, and high color contrast.", "category": "practice", "resource_url": "https://web.dev/learn/accessibility/"},
            ],
            [
                {"title": "Global state architecture with Zustand", "description": "Centralize cart, filter, or notification state without prop-drilling.", "category": "learn", "resource_url": "https://zustand.docs.pmnd.rs/"},
                {"title": "Implement file uploads & cloud storage", "description": "Add multipart file uploads (avatars, resumes, media) to Supabase Storage or S3.", "category": "build", "resource_url": ""},
            ],
            [
                {"title": "Web performance optimization & Core Web Vitals", "description": "Optimize bundle sizes, dynamic code-splitting, font loading, and image compression.", "category": "practice", "resource_url": "https://web.dev/explore/learn-core-web-vitals"},
                {"title": "Web security audit (OWASP Top 10)", "description": "Harden against XSS, CSRF, SQL injection, and enforce security headers.", "category": "read", "resource_url": "https://owasp.org/www-project-top-ten/"},
            ],
            [
                {"title": "Capstone Full-Stack application launch", "description": "Finalize and launch a feature-complete SaaS, marketplace, or collaboration tool.", "category": "build", "resource_url": ""},
                {"title": "Write comprehensive architecture case study", "description": "Publish a detailed write-up of your tech stack, database schema, and challenges solved.", "category": "read", "resource_url": ""},
                {"title": "Apply to 5 Full-Stack Developer roles", "description": "Submit customized applications with live demo links and tailored cover notes.", "category": "apply", "resource_url": ""},
            ],
            [
                {"title": "Server-side rendering & Next.js App Router", "description": "Deep-dive into React Server Components, server actions, and streaming SSR.", "category": "learn", "resource_url": "https://nextjs.org/docs"},
                {"title": "API rate-limiting & Redis caching", "description": "Add Redis for session caching and rate-limiting high-traffic API routes.", "category": "practice", "resource_url": ""},
            ],
            [
                {"title": "Real-time communication with WebSockets", "description": "Implement live chat or collaborative presence using Socket.io or WebSockets.", "category": "build", "resource_url": ""},
                {"title": "Third-party webhook integrations", "description": "Implement signed webhook consumers (e.g. Stripe payment events).", "category": "practice", "resource_url": ""},
            ],
            [
                {"title": "Open-source contribution to React or Node libraries", "description": "Improve documentation or fix a bug in a popular open-source project.", "category": "apply", "resource_url": "https://goodfirstissue.dev/"},
                {"title": "System design & scalability interview prep", "description": "Review system design concepts: CDNs, microservices vs. monoliths, message queues.", "category": "read", "resource_url": ""},
            ],
            [
                {"title": "Final Portfolio audit & interview pipeline", "description": "Align your DevHire profile, GitHub repositories, and resume for hiring managers.", "category": "apply", "resource_url": ""},
                {"title": "Conduct mock technical interviews", "description": "Practice coding challenges and behavioral questions with peers or mentors.", "category": "practice", "resource_url": ""},
            ],
        ],
    },
    "frontend developer": {
        "skill_gaps": ["React", "TypeScript", "CSS Animations", "Accessibility (a11y)", "Performance Optimization", "Next.js"],
        "tasks_per_week": [
            [
                {"title": "Modern CSS & Responsive Layouts", "description": "Master Flexbox, CSS Grid, container queries, and fluid typography.", "category": "learn", "resource_url": "https://web.dev/learn/css/"},
                {"title": "TypeScript with React", "description": "Type components, props, hooks, event handlers, and API response models cleanly.", "category": "learn", "resource_url": "https://react-typescript-cheatsheet.netlify.app/"},
                {"title": "Build a responsive navigation & sidebar", "description": "Implement a modern accessible responsive navigation layout with mobile drawer.", "category": "build", "resource_url": ""},
            ],
            [
                {"title": "Deep dive into React Hooks & Custom Hooks", "description": "Master useState, useEffect, useRef, useMemo, and write custom reusable hooks.", "category": "learn", "resource_url": "https://react.dev/reference/react"},
                {"title": "Client-side routing & layouts", "description": "Configure nested layouts, dynamic routes, and protected route wrappers.", "category": "practice", "resource_url": ""},
                {"title": "Accessible modal & dropdown components", "description": "Build interactive dialogs with focus trapping, ESC key listener, and ARIA attributes.", "category": "build", "resource_url": ""},
            ],
            [
                {"title": "Form validation with React Hook Form & Zod", "description": "Build high-performance forms with schema validation and accessible error announcements.", "category": "learn", "resource_url": "https://react-hook-form.com/"},
                {"title": "Server state management with TanStack Query", "description": "Implement pagination, infinite scrolling, background revalidation, and caching.", "category": "practice", "resource_url": "https://tanstack.com/query/latest"},
                {"title": "Build a live search & filtering interface", "description": "Create an interactive job/product browser with debounced search, facet chips, and empty states.", "category": "build", "resource_url": ""},
            ],
            [
                {"title": "Framer Motion & Micro-Interactions", "description": "Add smooth page transitions, enter/exit animations, and hover micro-interactions.", "category": "build", "resource_url": "https://www.framer.com/motion/"},
                {"title": "Core Web Vitals & Lighthouse Optimization", "description": "Audit with Lighthouse and optimize LCP, CLS, and INP metrics.", "category": "practice", "resource_url": "https://web.dev/explore/learn-core-web-vitals"},
                {"title": "Deploy portfolio site to Vercel", "description": "Deploy your frontend with custom domain, automated preview branches, and SSL.", "category": "apply", "resource_url": "https://vercel.com/docs"},
            ],
            [
                {"title": "Comprehensive Accessibility (a11y) Audit", "description": "Run axe DevTools on all pages, fix ARIA violations, and verify screen reader flow.", "category": "practice", "resource_url": "https://www.deque.com/axe/devtools/"},
                {"title": "Automated component testing with Vitest & RTL", "description": "Write unit and interaction tests for key UI components and state machines.", "category": "practice", "resource_url": "https://testing-library.com/"},
            ],
            [
                {"title": "Light/Dark mode theming with CSS variables", "description": "Implement seamless theme toggling with zero flash on initial load.", "category": "build", "resource_url": ""},
                {"title": "Next.js App Router & Server Components", "description": "Understand the difference between Server Components and Client Components in Next.js.", "category": "learn", "resource_url": "https://nextjs.org/docs"},
            ],
            [
                {"title": "Frontend build tooling & Bundle analysis", "description": "Analyze JavaScript bundles, eliminate unused packages, and set up dynamic imports.", "category": "practice", "resource_url": ""},
                {"title": "Contribute to open-source UI component library", "description": "Pick a beginner issue in an active open-source frontend project and submit a PR.", "category": "apply", "resource_url": "https://goodfirstissue.dev/"},
            ],
            [
                {"title": "Polish developer portfolio capstone", "description": "Feature interactive live demos, case studies, and responsive design proofs of work.", "category": "build", "resource_url": ""},
                {"title": "Update DevHire profile & online presence", "description": "List all verified technical skills, live project URLs, and GitHub repos.", "category": "apply", "resource_url": ""},
                {"title": "Apply to 5 Frontend Developer positions", "description": "Send tailored applications highlighting specific frontend achievements.", "category": "apply", "resource_url": ""},
            ],
            [
                {"title": "State machines with XState", "description": "Model complex UI states (e.g., checkout flows, media players) as finite state machines.", "category": "learn", "resource_url": "https://stately.ai/docs/xstate"},
                {"title": "CSS architecture & Design Systems", "description": "Design an extensible design system with reusable component tokens.", "category": "practice", "resource_url": ""},
            ],
            [
                {"title": "Offline-first & Service Workers", "description": "Add PWA capabilities, offline fallback caching, and background sync.", "category": "build", "resource_url": ""},
                {"title": "Internationalization (i18n)", "description": "Implement multi-language localization with next-intl or react-i18next.", "category": "practice", "resource_url": ""},
            ],
            [
                {"title": "WebSockets in the browser", "description": "Handle live data feeds, reconnection backoffs, and optimistic rendering.", "category": "build", "resource_url": ""},
                {"title": "Frontend system design interview preparation", "description": "Study architecture for newsfeeds, rich text editors, and large dashboard grids.", "category": "read", "resource_url": ""},
            ],
            [
                {"title": "Final Portfolio launch & interview rounds", "description": "Engage with recruiters and prepare for live frontend coding interviews.", "category": "apply", "resource_url": ""},
                {"title": "Write a technical article on Dev.to or Hashnode", "description": "Share a deep dive on an interesting frontend challenge you solved.", "category": "apply", "resource_url": "https://dev.to/"},
            ],
        ],
    },
}

DEFAULT_SUMMARY_TEMPLATE = (
    "Based on your profile as a {headline}, you're building a solid foundation as a {target_role}. "
    "The roadmap below focuses on the most in-demand skills employers are looking for right now, "
    "turning identified gaps into concrete weekly actions you can start today."
)

GENERIC_ROADMAP_WEEKS: List[List[Dict[str, str]]] = [
    [
        {"title": "Research core requirements & map skill gaps", "description": "Survey top job listings for your target role and document the top 5 technical skills required.", "category": "read", "resource_url": ""},
        {"title": "Set up a dedicated learning repository", "description": "Create a clean GitHub repo for your roadmap sprint to track exercises and mini-projects.", "category": "build", "resource_url": ""},
    ],
    [
        {"title": "Complete in-depth fundamentals tutorial", "description": "Master core concepts and principles essential for your target role.", "category": "learn", "resource_url": "https://www.freecodecamp.org/"},
        {"title": "Build a focused practice proof-of-concept", "description": "Implement a small, working prototype using the new technology stack.", "category": "practice", "resource_url": ""},
    ],
    [
        {"title": "Write automated unit tests", "description": "Add test suites verifying business logic, edge cases, and error handling.", "category": "practice", "resource_url": ""},
        {"title": "Refactor for clean code & design patterns", "description": "Apply clean code principles, modularity, and separation of concerns.", "category": "practice", "resource_url": ""},
    ],
    [
        {"title": "Build a complete Portfolio Project", "description": "Develop a realistic, end-to-end portfolio piece demonstrating your newly acquired skills.", "category": "build", "resource_url": ""},
        {"title": "Deploy live to a cloud platform", "description": "Deploy your project to a public cloud service (Vercel, Render, Railway, AWS) with SSL.", "category": "apply", "resource_url": ""},
    ],
    [
        {"title": "Implement automated CI/CD pipeline", "description": "Automate testing, linting, and build validation using GitHub Actions.", "category": "build", "resource_url": "https://docs.github.com/en/actions"},
        {"title": "Performance profiling & optimization", "description": "Identify and resolve latency, memory, or rendering bottlenecks.", "category": "practice", "resource_url": ""},
    ],
    [
        {"title": "Security audit & vulnerability scanning", "description": "Harden credentials, environment configs, and dependencies against known CVEs.", "category": "practice", "resource_url": ""},
        {"title": "Write comprehensive technical documentation", "description": "Add architecture diagrams, API specs, and clean setup guides in your README.", "category": "read", "resource_url": ""},
    ],
    [
        {"title": "Contribute to an open-source project", "description": "Find an active repository in your target domain and submit a meaningful contribution.", "category": "apply", "resource_url": "https://goodfirstissue.dev/"},
        {"title": "Peer code review & feedback iteration", "description": "Request feedback on your code from fellow developers and refactor based on reviews.", "category": "practice", "resource_url": ""},
    ],
    [
        {"title": "Final Portfolio polish & DevHire profile update", "description": "Feature your deployed capstone, verified skills, and updated headline on your DevHire profile.", "category": "apply", "resource_url": ""},
        {"title": "Apply to 5 targeted positions", "description": "Submit customized applications with tailored pitches highlighting your new skills.", "category": "apply", "resource_url": ""},
    ],
    [
        {"title": "Advanced architecture & design patterns", "description": "Study scalable system design and industry best practices for your target domain.", "category": "learn", "resource_url": ""},
        {"title": "Add telemetry & error logging", "description": "Integrate structured logging and error monitoring.", "category": "build", "resource_url": ""},
    ],
    [
        {"title": "Build an advanced feature extension", "description": "Extend your portfolio application with a high-value advanced capability.", "category": "build", "resource_url": ""},
        {"title": "Conduct load & stress testing", "description": "Verify reliability under simulated peak traffic.", "category": "practice", "resource_url": ""},
    ],
    [
        {"title": "Domain interview preparation", "description": "Practice technical interview questions and scenario-based problem solving.", "category": "practice", "resource_url": ""},
        {"title": "Publish a technical case study", "description": "Share your learning journey and architectural takeaways publicly.", "category": "apply", "resource_url": ""},
    ],
    [
        {"title": "Full pipeline interview blitz", "description": "Network with hiring managers and apply to top matching roles.", "category": "apply", "resource_url": ""},
        {"title": "Milestone retrospective & next goals", "description": "Review completed roadmap milestones and celebrate your career progress.", "category": "apply", "resource_url": ""},
    ],
]


def _build_fallback_roadmap(
    user_profile: Dict[str, Any],
    target_role: str,
    duration_days: int,
) -> Dict[str, Any]:
    """
    Build a structured fallback roadmap using curated templates when Gemini is unavailable.
    Guarantees every week has unique, progressive, non-repeating tasks.
    """
    role_key = target_role.lower().strip()
    template = COMMON_ROADMAPS.get(role_key)

    # Try partial match
    if not template:
        for k, v in COMMON_ROADMAPS.items():
            if any(word in role_key for word in k.split()):
                template = v
                break

    # Generic fallback
    if not template:
        template = {
            "skill_gaps": ["Automated Testing", "Docker", "CI/CD", "Cloud Deployment", "Open Source Contribution", "System Design"],
            "tasks_per_week": GENERIC_ROADMAP_WEEKS,
        }

    user_skills = {s.lower().strip() for s in (user_profile.get("skills") or [])}
    skill_gaps = [g for g in template["skill_gaps"] if g.lower() not in user_skills]
    if not skill_gaps:
        skill_gaps = template["skill_gaps"][:4]

    num_weeks = max(duration_days // 7, 1)
    tasks_per_week_data = template["tasks_per_week"]

    tasks = []
    order_counter = 0
    for week_idx in range(num_weeks):
        week_num = week_idx + 1
        if week_idx < len(tasks_per_week_data):
            week_tasks_source = tasks_per_week_data[week_idx]
        else:
            # For weeks beyond defined templates, generate distinct progressive milestones
            week_tasks_source = [
                {
                    "title": f"Deepen advanced topics in {target_role} (Week {week_num})",
                    "description": f"Focus on advanced architectural patterns, optimization, and edge cases in {target_role}.",
                    "category": "learn",
                    "resource_url": "",
                },
                {
                    "title": f"Expand portfolio capstone feature set (Week {week_num})",
                    "description": "Implement a production-grade enhancement to your ongoing portfolio application.",
                    "category": "build",
                    "resource_url": "",
                },
            ]

        for task in week_tasks_source:
            tasks.append({
                "title": task["title"],
                "description": task["description"],
                "category": task["category"],
                "resource_url": task.get("resource_url", ""),
                "week": week_num,
                "order": order_counter,
            })
            order_counter += 1

    headline = user_profile.get("headline") or "Software Developer"
    summary = DEFAULT_SUMMARY_TEMPLATE.format(headline=headline, target_role=target_role)

    return {
        "summary": summary,
        "skill_gaps": skill_gaps,
        "tasks": tasks,
    }


def generate_career_roadmap(
    user_profile: Dict[str, Any],
    target_role: str,
    duration_days: int = 30,
    job_samples: Optional[List[Dict[str, Any]]] = None,
    api_key: str = "",
) -> Dict[str, Any]:
    """
    Generates a personalized career roadmap with skill gap analysis.

    Args:
        user_profile: Developer profile dict (name, headline, skills, projects, experience, bio).
        target_role:  The role the developer wants to reach (e.g. "Junior Django Developer").
        duration_days: Roadmap duration, 30 or 60.
        job_samples:  Sample job listings for market context.
        api_key:      Google Gemini API key.

    Returns:
        dict: {"summary": str, "skill_gaps": list, "tasks": list, "ai_enhanced": bool}
    """
    num_weeks = max(duration_days // 7, 1)

    # Format job samples for the prompt
    job_text = "No specific job listings provided."
    if job_samples:
        parts = []
        for j in job_samples[:5]:
            tech = ", ".join(str(t) for t in (j.get("tech_stack") or []))
            parts.append(f"- {j.get('title', 'Role')}: tech_stack=[{tech}], requirements={str(j.get('requirements', ''))[:200]}")
        job_text = "\n".join(parts)

    # Format user data for prompt
    skills_list = [str(s) for s in (user_profile.get("skills") or [])]
    skills_text = ", ".join(skills_list) if skills_list else "Not specified"

    projects_raw = user_profile.get("projects") or []
    proj_parts = []
    if isinstance(projects_raw, list):
        for p in projects_raw[:3]:
            if isinstance(p, dict):
                proj_parts.append(f"{p.get('title', 'Project')}: {p.get('description', '')[:100]}")
            elif isinstance(p, str):
                proj_parts.append(p)
    projects_text = "; ".join(proj_parts) if proj_parts else "None listed"

    exp_raw = user_profile.get("experience") or []
    exp_parts = []
    if isinstance(exp_raw, list):
        for e in exp_raw[:2]:
            if isinstance(e, dict):
                role = e.get("title") or e.get("position") or e.get("role", "Role")
                company = e.get("company", "")
                exp_parts.append(f"{role} at {company}")
            elif isinstance(e, str):
                exp_parts.append(e)
    exp_text = "; ".join(exp_parts) if exp_parts else "None listed"

    if not api_key:
        result = _build_fallback_roadmap(user_profile, target_role, duration_days)
        result["ai_enhanced"] = False
        return result

    try:
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore

        client = genai.Client(api_key=api_key)
        prompt = PROMPT_TEMPLATE.format(
            name=user_profile.get("name") or user_profile.get("first_name") or "Developer",
            headline=user_profile.get("headline") or "Software Developer",
            skills=skills_text,
            projects=projects_text,
            experience=exp_text,
            bio=(user_profile.get("bio") or "Not specified")[:300],
            target_role=target_role,
            duration_days=duration_days,
            num_weeks=num_weeks,
            job_samples=job_text,
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.5,
                response_mime_type="application/json",
            ),
        )

        raw = (response.text or "").strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        data = json.loads(raw)
        tasks_raw = data.get("tasks") or []

        # Normalize tasks — add week/order if Gemini omitted them
        tasks = []
        for idx, t in enumerate(tasks_raw):
            if not isinstance(t, dict):
                continue
            week = int(t.get("week", (idx // 4) + 1))
            tasks.append({
                "title": str(t.get("title", ""))[:300],
                "description": str(t.get("description", ""))[:500],
                "category": t.get("category", "learn") if t.get("category") in ("learn", "build", "practice", "read", "apply") else "learn",
                "resource_url": str(t.get("resource_url", ""))[:500],
                "week": week,
                "order": idx,
            })

        if tasks:
            return {
                "summary": str(data.get("summary", ""))[:800],
                "skill_gaps": [str(g) for g in (data.get("skill_gaps") or [])[:8]],
                "tasks": tasks,
                "ai_enhanced": True,
            }

    except Exception as exc:
        logger.warning("Gemini career roadmap generation failed, using fallback: %s", exc)

    result = _build_fallback_roadmap(user_profile, target_role, duration_days)
    result["ai_enhanced"] = False
    return result
