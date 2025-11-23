import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("write", "routes/write.tsx"),
  route("profile", "routes/profile.tsx"),
  route("article/:id", "routes/article.$id.tsx"),
  route("tags/:tag", "routes/tags.$tag.tsx"),
  route("search", "routes/search.tsx"),
  route("edit-profile", "routes/edit-profile.tsx"),
  route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;
