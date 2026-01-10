// pages/admin/EditEngineerPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Eye, EyeOff, Shield } from 'lucide-react';
import { getEngineers, updateEngineer } from '../../api/admin';
import type { Engineer } from '../../api/admin';
import { toast } from 'react-toastify';

const EditEngineerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    isActive: true,
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEngineer();
  }, [id]);

  const fetchEngineer = async () => {
    try {
      setLoading(true);
      const engineers = await getEngineers();
      const foundEngineer = engineers.find(e => e._id === id);
      
      if (!foundEngineer) {
        toast.error('Engineer not found');
        navigate('/admin/engineers');
        return;
      }
      
      setEngineer(foundEngineer);
      setFormData({
        name: foundEngineer.name,
        email: foundEngineer.email,
        isActive: foundEngineer.isActive,
        password: '' // Empty by default - only change if provided
      });
    } catch (error) {
      console.error('Failed to fetch engineer:', error);
      toast.error('Failed to load engineer details');
      navigate('/admin/engineers');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setUpdating(true);
      
      // Prepare update data - only include fields that changed
      const updateData: any = {};
      
      if (formData.name !== engineer?.name) {
        updateData.name = formData.name.trim();
      }
      
      if (formData.email !== engineer?.email) {
        updateData.email = formData.email.trim().toLowerCase();
      }
      
      if (formData.isActive !== engineer?.isActive) {
        updateData.isActive = formData.isActive;
      }
      
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateEngineer(id!, updateData);
        toast.success('Engineer updated successfully!');
        navigate('/admin/engineers');
      } else {
        toast.info('No changes were made');
        navigate('/admin/engineers');
      }
    } catch (error: any) {
      console.error('Failed to update engineer:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update engineer';
      toast.error(errorMessage);
      
      // Handle specific backend errors
      if (errorMessage.includes('already exists')) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!engineer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/engineers')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Engineers
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Engineer</h1>
              <p className="text-gray-600">Update engineer account details</p>
            </div>
          </div>
        </div>

        {/* Current Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              {/* <p className="text-sm font-medium text-blue-800 mb-1">Engineer ID: {engineer._id}</p> */}
              <p className="text-sm text-blue-700">
                Created: {engineer.createdAt ? new Date(engineer.createdAt).toLocaleDateString() : 'N/A'}
                {engineer.role && ` • Role: ${engineer.role.replace('_', ' ').toUpperCase()}`}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter full name"
                  disabled={updating}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="engineer@example.com"
                  disabled={updating}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={updating}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Account is active
                  </span>
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Inactive engineers cannot log into the system
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password (optional)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Leave blank to keep current password"
                    disabled={updating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={updating}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Enter a new password only if you want to change it
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/admin/engineers')}
                  disabled={updating}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEngineerPage;