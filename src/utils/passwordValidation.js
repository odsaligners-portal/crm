/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    return { isValid: false, errors: ["Password is required"] };
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/(?=.*[@$!%*?&#])/.test(password)) {
    errors.push(
      "Password must contain at least one special character (@$!%*?&#)",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get password strength indicator
 * @param {string} password - The password to check
 * @returns {Object} - { strength: 'weak' | 'medium' | 'strong', score: number }
 */
export const getPasswordStrength = (password) => {
  if (!password) {
    return { strength: "weak", score: 0 };
  }

  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/(?=.*[a-z])/.test(password)) score += 1;
  if (/(?=.*[A-Z])/.test(password)) score += 1;
  if (/(?=.*\d)/.test(password)) score += 1;
  if (/(?=.*[@$!%*?&#])/.test(password)) score += 1;

  if (score <= 2) {
    return { strength: "weak", score };
  } else if (score <= 4) {
    return { strength: "medium", score };
  } else {
    return { strength: "strong", score };
  }
};
