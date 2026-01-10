// pages/admin/EngineerListPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Users,
  Filter,
  RefreshCw
} from 'lucide-react';
import { getEngineers, deleteEngineer, updateEngineerStatus } from '../../api/admin';
import type { Engineer } from '../../api/admin';
import { toast } from 'react-toastify';

const EngineerListPage: React.FC = () => {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEngineers();
  }, []);

  const fetchEngineers = async () => {
    try {
      setLoading(true);
      const data = await getEngineers();
      setEngineers(data);
    } catch (error) {
      console.error('Failed to fetch engineers:', error);
      toast.error('Failed to load engineers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete engineer "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteEngineer(id);
      toast.success('Engineer deleted successfully');
      fetchEngineers(); // Refresh list
    } catch (error: any) {
      console.error('Failed to delete engineer:', error);
      toast.error(error.response?.data?.message || 'Failed to delete engineer');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!window.confirm(`Are you sure you want to ${action} engineer "${name}"?`)) {
      return;
    }

    try {
      setTogglingId(id);
      await updateEngineerStatus(id, newStatus);
      toast.success(`Engineer ${action}d successfully`);
      fetchEngineers(); // Refresh list
    } catch (error: any) {
      console.error('Failed to update engineer status:', error);
      toast.error(error.response?.data?.message || 'Failed to update engineer status');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredEngineers = engineers.filter(engineer => {
    // Search filter
    const matchesSearch = 
      engineer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      engineer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      filterActive === 'all' ||
      (filterActive === 'active' && engineer.isActive) ||
      (filterActive === 'inactive' && !engineer.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const activeCount = engineers.filter(e => e.isActive).length;
  const inactiveCount = engineers.filter(e => !e.isActive).length;
  const totalCount = engineers.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Engineer Management</h1>
              <p className="text-gray-600 mt-1">Manage maintenance engineers</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchEngineers}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                to="/admin/engineers/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Engineer
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Engineers</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
                </div>
                <UserX className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Rate</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}%
                  </p>
                </div>
                <Filter className="w-8 h-8 text-indigo-500" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterActive('all')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${filterActive === 'all' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterActive('active')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${filterActive === 'active' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterActive('inactive')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${filterActive === 'inactive' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Engineers Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEngineers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        {searchTerm || filterActive !== 'all' 
                          ? 'No engineers match your filters'
                          : 'No engineers found'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEngineers.map((engineer) => (
                    <tr key={engineer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {engineer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {engineer.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{engineer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(engineer._id, engineer.isActive, engineer.name)}
                          disabled={togglingId === engineer._id}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${engineer.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                          } disabled:opacity-50`}
                        >
                          {togglingId === engineer._id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                          ) : engineer.isActive ? (
                            'Active'
                          ) : (
                            'Inactive'
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {engineer.createdAt ? new Date(engineer.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/engineers/${engineer._id}/edit`)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(engineer._id, engineer.name)}
                            disabled={deletingId === engineer._id}
                            className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === engineer._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-sm text-gray-500">
          Showing {filteredEngineers.length} of {engineers.length} engineers
          {searchTerm && ` • Searching for "${searchTerm}"`}
          {filterActive !== 'all' && ` • Filtered by ${filterActive}`}
        </div>

      </div>
    </div>
  );
};

export default EngineerListPage;