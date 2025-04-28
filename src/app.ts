import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/configure-open-api";

// routes
import index from "@/routes/index.route";
import demo from "@/routes/demo/demo.index";
import clerk from "@/routes/webhooks/clerk/clerk.index";
import user from "@/routes/user/user.index";
import chat from "@/routes/chat/chat.index";
import notes from "@/routes/notes/notes.index";

const app = createApp();

const routes = [
  index,
  demo,
  clerk,
  user,
  chat,
  notes,
];

configureOpenAPI(app);

routes.forEach((route) => {
  app.route("/", route);
});

export default app;
