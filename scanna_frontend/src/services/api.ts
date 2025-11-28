export const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_BASE_URL = BASE_URL;

// Tipos
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  area: string;
  cedula_profesional?: string;
  hospital?: string;
  telefono?: string;
}

export interface Especialista {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  area?: string;
  cedula_profesional?: string;
  hospital?: string;
  telefono?: string;
  activo: boolean;
  fechaRegistro: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  especialista: Especialista;
}

export interface DashboardStats {
  detecciones_hoy: number;
  casos_positivos: number;
  total_pacientes: number;
  esta_semana: number;
  distribucion_edad: {
    total_casos: number;
    positivos: number;
    mayor_grupo: string;
    datos_grafico: Array<{
      rango: string;
      total: number;
      positivos: number;
      negativos: number;
    }>;
  };
  resumen_detecciones: {
    total_casos: number;
    positivos: number;
    negativos: number;
    tasa_deteccion: number;
  };
  confianza_promedio: number;
}

export interface Registro {
  _id: string;
  numeroExpediente: string;
  paciente: {
    nombre: string;
    edad: number;
    sexo: string;
  };
  especialistaId: string;
  imagenes: {
    rutaOriginal?: string;
    rutaMapaAtencion?: string;
  };
  analisis: {
    resultado?: string;
    aiSummary?: string;
    confianza?: number;
  };
  resultado: string;
  fechaAnalisis: string;
}

export interface EspecialistaEstadisticas {
  total_analisis: number;
  positivos: number;
  negativos: number;
  tasa_positividad: number;
  ultimos_analisis: Registro[];
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// ==================== AUTH ====================

export const authAPI = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al iniciar sesión');
    }

    const data = await response.json();
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('especialista', JSON.stringify(data.especialista));
    
    return data;
  },

  async register(userData: RegisterData): Promise<Especialista> {
    // CRÍTICO: El backend de FastAPI inserta None si no recibe estos campos
    // MongoDB rechaza None, así que SIEMPRE enviamos strings (vacíos si es necesario)
    const cleanData = {
      nombre: userData.nombre,
      apellido: userData.apellido,
      email: userData.email,
      password: userData.password,
      area: userData.area,
      cedula_profesional: userData.cedula_profesional?.trim() || '',
      hospital: userData.hospital?.trim() || '',
      telefono: userData.telefono?.trim() || '',
    };
  
    console.log('📤 Datos a enviar al backend:', cleanData);
  
    const response = await fetch(`${API_BASE_URL}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanData),
    });
  
    if (!response.ok) {
      let errorMessage = 'Error al registrarse';
      try {
        const error = await response.json();
        console.error('❌ Error del backend:', error);
        
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail.map((e: any) => 
              `${e.loc?.join('.') || 'campo'}: ${e.msg}`
            ).join(', ');
          }
        }
      } catch (e) {
        errorMessage = `Error ${response.status}`;
      }
      
      throw new Error(errorMessage);
    }
  
    return await response.json();
  },

  async verifyToken(): Promise<Especialista> {
    const response = await fetch(`${API_BASE_URL}/auth/verificar-token`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Token inválido');
    }

    return await response.json();
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('especialista');
  },

  getStoredEspecialista(): Especialista | null {
    const data = localStorage.getItem('especialista');
    return data ? JSON.parse(data) : null;
  },
};

// ==================== DASHBOARD ====================

export const dashboardAPI = {
  async getEstadisticas(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE_URL}/dashboard/estadisticas`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al cargar estadísticas');
    }

    return await response.json();
  },

  async getActividadReciente(limit: number = 10) {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/actividad-reciente?limit=${limit}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Error al cargar actividad reciente');
    }

    return await response.json();
  },

  async getTendencias(dias: number = 30) {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/tendencias?dias=${dias}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Error al cargar tendencias');
    }

    return await response.json();
  },
};

// ==================== REGISTROS ====================

export const registrosAPI = {
  async crear(formData: FormData): Promise<Registro> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/registros/`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear registro');
    }

    return await response.json();
  },

  async listar(params?: {
    skip?: number;
    limit?: number;
    resultado?: string;
    buscar?: string;
  }): Promise<Registro[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.resultado) queryParams.append('resultado', params.resultado);
    if (params?.buscar) queryParams.append('buscar', params.buscar);

    const response = await fetch(
      `${API_BASE_URL}/registros/?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Error al cargar registros');
    }

    return await response.json();
  },

  async obtenerPorId(registroId: string): Promise<Registro> {
    const response = await fetch(`${API_BASE_URL}/registros/${registroId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al cargar registro');
    }

    return await response.json();
  },

  async obtenerPorExpediente(numeroExpediente: string): Promise<Registro> {
    const response = await fetch(
      `${API_BASE_URL}/registros/expediente/${numeroExpediente}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Error al cargar registro');
    }

    return await response.json();
  },

  async eliminar(registroId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/registros/${registroId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al eliminar registro');
    }
  },
};

// ==================== PERFIL ====================

export const perfilAPI = {
  async obtenerPerfil(): Promise<Especialista> {
    const response = await fetch(`${API_BASE_URL}/especialistas/perfil`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al cargar perfil');
    }

    return await response.json();
  },

  async actualizarPerfil(data: Partial<Especialista>): Promise<Especialista> {
    const response = await fetch(`${API_BASE_URL}/especialistas/perfil`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al actualizar perfil');
    }

    return await response.json();
  },

  async obtenerEstadisticas(): Promise<EspecialistaEstadisticas> {
    const response = await fetch(
      `${API_BASE_URL}/especialistas/estadisticas`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Error al cargar estadísticas');
    }

    return await response.json();
  },
};

export { API_BASE_URL };