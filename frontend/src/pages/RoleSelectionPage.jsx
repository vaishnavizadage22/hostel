import { RoleCard } from '../components/RoleCard';
import {
  AdminAvatar,
  WardenAvatar,
  StaffAvatar,
  ParentAvatar,
  StudentAvatar,
} from '../components/RoleAvatars';
import { Footer } from '../components/Footer';
import './RoleSelectionPage.css';

const roleCardsData = [
  {
    id: 'admin',
    title: 'Admin',
    description: 'Manage the entire hostel system, users and settings.',
    route: '/register/admin',
    bgColor: '#edf4ff',
    borderColor: '#d2e3fc',
    buttonColor: '#2563eb',
    buttonHoverColor: '#1d4ed8',
    shadowColor: 'rgba(37, 99, 235, 0.15)',
    avatarComponent: AdminAvatar,
  },
  {
    id: 'warden',
    title: 'Warden',
    description: 'Oversee hostel operations, manage students and approvals.',
    route: '/register/warden',
    bgColor: '#edf9f1',
    borderColor: '#c6eed3',
    buttonColor: '#22a355',
    buttonHoverColor: '#168442',
    shadowColor: 'rgba(34, 163, 85, 0.15)',
    avatarComponent: WardenAvatar,
  },
  {
    id: 'staff',
    title: 'College Staff',
    description: 'Manage attendance, academic details and student records.',
    route: '/register/staff',
    bgColor: '#f3f0fd',
    borderColor: '#dfd2fa',
    buttonColor: '#6d48c8',
    buttonHoverColor: '#5a37b3',
    shadowColor: 'rgba(109, 72, 200, 0.15)',
    avatarComponent: StaffAvatar,
  },
  {
    id: 'parent',
    title: 'Parent',
    description: "Monitor your child's hostel activities, attendance and updates.",
    route: '/register/parent',
    bgColor: '#fff3e8',
    borderColor: '#fedbbe',
    buttonColor: '#ea6526',
    buttonHoverColor: '#ca4f16',
    shadowColor: 'rgba(234, 101, 38, 0.15)',
    avatarComponent: ParentAvatar,
  },
  {
    id: 'student',
    title: 'Student',
    description: 'Apply for hostel admission, manage your profile and stay updates.',
    route: '/register/student',
    bgColor: '#fff0f4',
    borderColor: '#fed2dc',
    buttonColor: '#d8376b',
    buttonHoverColor: '#b82354',
    shadowColor: 'rgba(216, 55, 107, 0.15)',
    avatarComponent: StudentAvatar,
  },
];

export const RoleSelectionPage = () => {
  // First row: 3 cards
  const firstRowCards = roleCardsData.slice(0, 3);
  // Second row: 2 cards centered
  const secondRowCards = roleCardsData.slice(3, 5);

  return (
    <div className="role-selection-wrapper">
      {/* Decorative background shapes */}
      <div className="bg-shape bg-shape-top-left" aria-hidden="true" />
      <div className="bg-shape bg-shape-bottom-left" aria-hidden="true" />
      <div className="bg-shape bg-shape-top-right" aria-hidden="true" />

      <main className="role-selection-main">
        {/* Header Heading Section */}
        <section className="selection-header-section">
          <h1 className="selection-title">
            Welcome to Hostel Management System
          </h1>
          <div className="selection-account-label">
            Create Your Account
          </div>
          <p className="selection-subtitle">
            Select your role to continue with the registration process.
          </p>
          <div className="selection-blue-divider" aria-hidden="true" />
        </section>

        {/* Role Cards Grid Container */}
        <section className="role-cards-container" aria-label="Role registration selection">
          {/* First Row: 3 Cards */}
          <div className="cards-row cards-row-first">
            {firstRowCards.map((card) => (
              <RoleCard key={card.id} {...card} />
            ))}
          </div>

          {/* Second Row: 2 Centered Cards */}
          <div className="cards-row cards-row-second">
            {secondRowCards.map((card) => (
              <RoleCard key={card.id} {...card} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer with Safe Stay and decorative building */}
      <Footer />
    </div>
  );
};
