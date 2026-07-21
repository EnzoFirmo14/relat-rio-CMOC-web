import { configureStore, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    uid?: string;
    email?: string | null;
    name: string;
    role: string;
    username: string;
  } | null;
  loading: boolean;
}

const initialAuth: AuthState = {
  isAuthenticated: localStorage.getItem('cmoc_auth') === 'true',
  user: JSON.parse(localStorage.getItem('cmoc_user') || 'null') || (localStorage.getItem('cmoc_auth') === 'true' ? {
    name: 'Eng. Pedro Santos',
    role: 'Supervisor de Mina',
    username: 'pedro.santos'
  } : null),
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuth,
  reducers: {
    login: (state, action: PayloadAction<{ uid?: string; email?: string | null; username?: string; name?: string; role?: string }>) => {
      state.isAuthenticated = true;
      state.user = {
        uid: action.payload.uid,
        email: action.payload.email,
        name: action.payload.name || 'Usuário Autenticado',
        role: action.payload.role || 'Operador',
        username: action.payload.username || (action.payload.email ? action.payload.email.split('@')[0] : 'user')
      };
      state.loading = false;
      localStorage.setItem('cmoc_auth', 'true');
      localStorage.setItem('cmoc_user', JSON.stringify(state.user));
    },
    setFirebaseUser: (state, action: PayloadAction<{ uid: string; email: string | null } | null>) => {
      if (action.payload) {
        state.isAuthenticated = true;
        // Keep existing user data if available to not break UI, or provide fallback
        state.user = {
          ...state.user,
          uid: action.payload.uid,
          email: action.payload.email,
          name: state.user?.name || 'Usuário Autenticado',
          role: state.user?.role || 'Operador',
          username: state.user?.username || (action.payload.email ? action.payload.email.split('@')[0] : 'user')
        };
        localStorage.setItem('cmoc_auth', 'true');
        localStorage.setItem('cmoc_user', JSON.stringify(state.user));
      } else {
        state.isAuthenticated = false;
        state.user = null;
        localStorage.removeItem('cmoc_auth');
        localStorage.removeItem('cmoc_user');
      }
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      localStorage.removeItem('cmoc_auth');
      localStorage.removeItem('cmoc_user');
    }
  }
});

interface ThemeState {
  mode: 'light' | 'dark';
}

const initialTheme: ThemeState = {
  mode: (localStorage.getItem('cmoc_theme') as 'light' | 'dark') || 'light'
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: initialTheme,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('cmoc_theme', state.mode);
      if (state.mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    initTheme: (state) => {
      if (state.mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
});

interface UiState {
  sidebarOpen: boolean;
}

const initialUi: UiState = {
  sidebarOpen: true
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUi,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    }
  }
});

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    theme: themeSlice.reducer,
    ui: uiSlice.reducer
  }
});

export const { login, logout, setFirebaseUser, setLoading } = authSlice.actions;
export const { toggleTheme, initTheme } = themeSlice.actions;
export const { toggleSidebar } = uiSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
