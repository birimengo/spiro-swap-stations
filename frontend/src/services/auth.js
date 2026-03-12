import api from './api';

export const login = async (username, password) => {
  try {
    const response = await api.post('/admin/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.admin));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Login failed' };
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const verifyToken = async () => {
  try {
    const response = await api.get('/admin/verify');
    return response.data;
  } catch (error) {
    logout();
    return null;
  }
};