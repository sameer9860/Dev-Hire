# DevHire - Open Source Talent Marketplace

**DevHire** is a modern, open-source job board and talent marketplace built for developers, by developers. It connects skilled freelancers and professionals with companies looking for top tech talent, all while prioritizing transparency, fairness, and community-driven development.

## 🚀 Key Features

### For Job Seekers
- **Personalized Job Feed:** Get matched with relevant opportunities based on your skills, experience, and career goals
- **Verified Profiles:** Showcase your skills, certifications, and project portfolio
- **Easy Application Tracking:** Manage your applications and interviews in one unified dashboard
- **Skill Validation:** Take optional skill tests to verify your expertise and boost your credibility
- **Community Reviews:** Read and contribute to transparent company reviews

### For Companies
- **Smart Talent Matching:** Find the best candidates with AI-powered recommendation engine
- **Post Verified Jobs:** Create detailed job listings with transparent requirements
- **Applicant Management:** Streamline your hiring process with organized candidate pipelines
- **Employer Branding:** Build your employer brand with company reviews and insights
- **Direct Messaging:** Communicate directly with candidates through our secure platform

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18+ (Next.js 14+ with App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/UI, Radix UI
- **State Management:** TanStack Query (React Query), Zustand
- **Authentication:** NextAuth.js / Clerk
- **Forms:** React Hook Form
- **Validation:** Zod
- **Data Fetching:** TanStack Query (React Query)

### Backend
- **Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **Database:** PostgreSQL (with Prisma ORM)
- **Authentication:** Passport.js (JWT, OAuth)
- **Real-time:** Socket.IO
- **Job Queue:** BullMQ (Redis)
- **Validation:** class-validator, class-transformer
- **Testing:** Jest, Supertest

### Infrastructure
- **Containerization:** Docker, Docker Compose
- **Deployment Target:** Kubernetes
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus, Grafana
- **Logging:** Winston, Elasticsearch, Kibana (ELK Stack)
- **Search:** Meilisearch (Optional for enhanced job search)

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm or yarn
- PostgreSQL 13 or higher
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/devhire/devhire.git
   cd devhire
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Database Setup**
   ```bash
   cd ../backend
   
   # Create database
   npx prisma db push
   ```

5. **Run the application**
   ```bash
   # Start backend
   cd ../backend
   npm run start:dev
   
   # Start frontend
   cd ../frontend
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 📂 Project Structure

```
devhire/
├── frontend/          # React/Next.js application
│   ├── app/           # Next.js App Router
│   ├── components/    # Reusable UI components
│   └── lib/           # Utilities and helpers
├── backend/           # NestJS application
│   ├── src/
│   │   ├── api/       # API routes and controllers
│   │   ├── modules/   # Feature modules (auth, jobs, users, etc.)
│   │   ├── core/      # Core services and middleware
│   │   └── filters/   # Exception filters
│   ├── prisma/        # Database schema and migrations
│   └── test/          # Test files
├── docker/            # Docker configuration files
├── .github/           # CI/CD workflows
├── .env.example       # Environment variable examples
└── README.md          # Project documentation
```

## 📚 Documentation

- [Backend Documentation](backend/docs/README.md)
- [Frontend Documentation](frontend/docs/README.md)
- [API Documentation](backend/docs/API.md)
- [Deployment Guide](docs/deployment.md)
- [Development Setup](docs/development.md)

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or reporting issues, your help is appreciated.

### Contribution Guidelines

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed information on our code of conduct, the process for submitting pull requests, and our development workflow.

### Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for everyone, regardless of gender, sexual orientation, disability, age, religion, or ethnicity. Please read and follow our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Community

- **Discord:** [Join our Discord server](https://discord.gg/your-server) (Coming soon)
- **GitHub Discussions:** [Start a discussion](https://github.com/devhire/devhire/discussions)
- **Twitter:** [@devhireapp](https://twitter.com/devhireapp) (Coming soon)

## 📄 Project Goals

- Create a transparent and ethical job marketplace that prioritizes developer well-being
- Provide high-quality tools for both job seekers and companies
- Build a thriving open-source community around talent acquisition
- Foster fair hiring practices and reduce bias in recruitment

## 📞 Contact

For support, collaboration opportunities, or general inquiries:

- **Email:** [EMAIL_ADDRESS]
- **GitHub Issues:** [Open an issue](https://github.com/devhire/devhire/issues)

---

**Star this project if you find it useful!** ⭐
