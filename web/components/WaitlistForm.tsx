import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface WaitlistFormProps {
  onSubmit: (email: string) => void;
  showSuccess: boolean;
}

interface FormData {
  email: string;
}

const WaitlistForm: React.FC<WaitlistFormProps> = ({ onSubmit, showSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const submitHandler = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      await onSubmit(data.email);
      reset();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div id="waitlist">
      {showSuccess ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-green-800 mb-1">You&apos;re on the list!</h3>
          <p className="text-green-700">We&apos;ll notify you when Quickfolio launches.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary hover:bg-secondary text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Joining...' : 'Join Waitlist'}
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            We&apos;ll never share your email. Unsubscribe anytime.
          </p>
        </form>
      )}
    </div>
  );
};

export default WaitlistForm;
