// File: src/redux/store.js
import { createStore } from "redux";

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  sessionId: localStorage.getItem("sessionId") || null,
  notifications: [],
};

function rootReducer(state = initialState, action) {
  switch (action.type) {
    case "LOGIN":
      // Lưu vào localStorage để đồng bộ
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("sessionId", action.payload.sessionId);
      return {
        ...state,
        user: action.payload.user,
        sessionId: action.payload.sessionId,
        authenticated: true,
      };
    case "LOGOUT":
      // Xóa localStorage khi logout
      localStorage.removeItem("user");
      localStorage.removeItem("sessionId");
      return { ...state, user: null, sessionId: null, notifications: [] , authenticated: false };
    case "UPDATE_NOTIFICATIONS":
      return { ...state, notifications: action.payload };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };
    default:
      return state;
  }
}

const store = createStore(rootReducer);

export default store;
