import React, { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Colors } from './Colors';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, style, ...props }: InputProps) {
  return (
    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label className="form-label" htmlFor={id} style={{ fontSize: '14px', fontWeight: 500, color: Colors.primaryText }}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={`form-input premium-input ${className}`}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '15px',
          borderRadius: '12px',
          border: error ? `1.5px solid ${Colors.errorRed}` : '1.5px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          color: Colors.primaryText,
          outline: 'none',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '12px', color: Colors.errorRed, marginTop: '2px', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, children, className = '', id, style, ...props }: SelectProps) {
  return (
    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label className="form-label" htmlFor={id} style={{ fontSize: '14px', fontWeight: 500, color: Colors.primaryText }}>
          {label}
        </label>
      )}
      <select
        id={id}
        className={`form-input form-select ${className}`}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '15px',
          borderRadius: '12px',
          border: error ? `1.5px solid ${Colors.errorRed}` : '1.5px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          color: Colors.primaryText,
          outline: 'none',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          ...style,
        }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span style={{ fontSize: '12px', color: Colors.errorRed, marginTop: '2px', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className = '', id, style, ...props }: TextAreaProps) {
  return (
    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label className="form-label" htmlFor={id} style={{ fontSize: '14px', fontWeight: 500, color: Colors.primaryText }}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`form-input premium-input ${className}`}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '15px',
          borderRadius: '12px',
          border: error ? `1.5px solid ${Colors.errorRed}` : '1.5px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          color: Colors.primaryText,
          outline: 'none',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '12px', color: Colors.errorRed, marginTop: '2px', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
}
