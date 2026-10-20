import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

import { MainLayout } from "@src/common/layout/MainLayout";
import { paths } from "@src/router/paths";
import { PreviewType } from "@src/provider/APIServiceProvider/preview/preview-model";
import { RelatedPostsButtonName } from "@src/common/component/Post";

const LandingPage = lazy(() => import("@src/feature/landing/LandingPage"));
const EducationPage = lazy(
  () => import("@src/feature/education/EducationPage"),
);
const PostsPage = lazy(() => import("@src/feature/post/PostsPage"));
// const TestPage = lazy(() => import("@src/feature/test/TestPage"));
// const AdminPage = lazy(() => import("@src/feature/admin/AdminPage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: paths.education,
        element: <EducationPage />,
      },
      {
        path: paths.achievements,
        element: (
          <PostsPage
            previewParam="achievement"
            type={PreviewType.Achievement}
            referenceButtonName={RelatedPostsButtonName.ACHIEVEMENT}
          />
        ),
      },
      {
        path: paths.projects,
        element: (
          <PostsPage
            previewParam="project"
            type={PreviewType.Project}
            referenceButtonName={RelatedPostsButtonName.PROJECT}
          />
        ),
      },
      {
        path: paths.career,
        element: (
          <PostsPage
            previewParam="career"
            type={PreviewType.Career}
            referenceButtonName={RelatedPostsButtonName.CAREER}
          />
        ),
      },
      // {
      //   path: paths.admin,
      //   element: <AdminPage />,
      // },
      // { path: "/test", element: <TestPage /> },
    ],
  },
]);

export default router;
