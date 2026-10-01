import React from 'react';

export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="error-msg">
      {message}
    </p>
  );
}
