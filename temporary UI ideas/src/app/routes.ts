import { createBrowserRouter } from "react-router";
import { LocationSelection } from "./screens/LocationSelection";
import { PersonalityStep } from "./screens/PersonalityStep";
import { InterestsStep } from "./screens/InterestsStep";
import { HobbiesStep } from "./screens/HobbiesStep";
import { ConversationDashboard } from "./screens/ConversationDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LocationSelection,
  },
  {
    path: "/personality",
    Component: PersonalityStep,
  },
  {
    path: "/interests",
    Component: InterestsStep,
  },
  {
    path: "/hobbies",
    Component: HobbiesStep,
  },
  {
    path: "/conversation",
    Component: ConversationDashboard,
  },
]);
