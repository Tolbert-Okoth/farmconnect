import React from 'react';

const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    let score = 0;
    if (!password) return score;

    // Add points for length
    if (password.length > 8) score++;
    if (password.length > 12) score++;
    // Add points for character types
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return Math.min(score, 5); // Max score of 5
  };

  const strength = getStrength();
  const colors = ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#198754'];
  const labels = ['Very Weak', 'Weak', 'Okay', 'Good', 'Strong'];

  const getWidth = () => {
    if (strength === 0) return '0%';
    return `${(strength / 5) * 100}%`;
  };

  return (
    <div>
      <div
        className="password-strength-meter"
        style={{
          width: getWidth(),
          backgroundColor: colors[strength - 1] || '#e9ecef',
        }}
      ></div>
      {password && (
        <p
          className="password-strength-text mt-1"
          style={{ color: colors[strength - 1] }}
        >
          {labels[strength - 1]}
        </p>
      )}
    </div>
  );
};

export default PasswordStrength;