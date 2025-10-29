
import React from 'react';
import type { FormField, FormData } from '../types';

interface FormFieldProps {
  field: FormField;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const FormFieldComponent: React.FC<FormFieldProps> = ({ field, value, onChange }) => {
  const commonInputClasses = "w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-gray-200 placeholder-gray-400";
  
  return (
    <div className="mb-6">
      <label htmlFor={field.id} className="block text-sm font-medium text-indigo-300 mb-1">
        {field.label}
      </label>
      <p className="text-xs text-gray-400 mb-2">{field.description}</p>
      {field.type === 'textarea' ? (
        <textarea
          id={field.id}
          name={field.id}
          rows={3}
          className={commonInputClasses}
          placeholder={field.placeholder}
          value={value}
          onChange={onChange}
        />
      ) : (
        <div className="relative">
          <select
            id={field.id}
            name={field.id}
            className={`${commonInputClasses} appearance-none`}
            value={value}
            onChange={onChange}
          >
            {field.options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormFieldComponent;
