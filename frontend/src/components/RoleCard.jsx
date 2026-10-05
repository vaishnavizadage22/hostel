import { useNavigate } from 'react-router-dom';
import './RoleCard.css';

export const RoleCard = ({
  id,
  title,
  description,
  buttonText = 'Register',
  route,
  bgColor,
  borderColor,
  buttonColor,
  buttonHoverColor,
  shadowColor,
  avatarComponent: AvatarComponent,
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(route);
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    navigate(route);
  };

  return (
    <div
      className={`role-card role-card-${id}`}
      style={{
        '--card-bg': bgColor,
        '--card-border': borderColor,
        '--btn-bg': buttonColor,
        '--btn-hover-bg': buttonHoverColor,
        '--card-shadow-color': shadowColor,
      }}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Select ${title} registration`}
    >
      {/* Top circular Avatar / Illustration area */}
      <div className="role-avatar-wrapper">
        {AvatarComponent && <AvatarComponent />}
      </div>

      {/* Role Title */}
      <h3 className="role-title">{title}</h3>

      {/* Role Description */}
      <p className="role-description">{description}</p>

      {/* Register Action Button */}
      <button
        type="button"
        className="role-action-btn"
        onClick={handleButtonClick}
        aria-label={`Register as ${title}`}
      >
        <span>{buttonText}</span>
        <svg
          className="btn-arrow-icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
};
