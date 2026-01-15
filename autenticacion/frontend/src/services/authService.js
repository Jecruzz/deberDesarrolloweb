const API_URL = '/api/auth';

export const authService = {
  // Registrar nuevo usuario
  register: async (email, password, name) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Incluir cookies en la petición
      body: JSON.stringify({ email, password, name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar usuario');
    }

    const data = await response.json();
    
    // Guardar usuario en localStorage (sin el token, que está en la cookie)
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  },

  // Iniciar sesión
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Incluir cookies en la petición
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar sesión');
    }

    const data = await response.json();
    
    // Guardar usuario en localStorage (sin el token, que está en la cookie)
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  },

  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('user');
    // La cookie será eliminada por el servidor (si se implementa la ruta de logout)
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Verificar si está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('user');
  },

  // Obtener perfil del servidor
  getProfile: async () => {
    const response = await fetch(`${API_URL}/me`, {
      credentials: 'include' // Incluir cookies en la petición
    });

    if (!response.ok) {
      throw new Error('Error al obtener perfil');
    }

    return response.json();
  },

  // Hacer petición autenticada
  fetchWithAuth: async (url, options = {}) => {
    const config = {
      ...options,
      credentials: 'include', // Incluir cookies en la petición
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      }
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Token expirado o inválido
      authService.logout();
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }

    return response;
  }
};
