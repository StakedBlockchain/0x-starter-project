// @material-ui/icons
import Dashboard from "@material-ui/icons/Dashboard";
import Person from "@material-ui/icons/Person";
// import ContentPaste from "@material-ui/icons/ContentPaste";
import LibraryBooks from "@material-ui/icons/LibraryBooks";
import BubbleChart from "@material-ui/icons/BubbleChart";
import LocationOn from "@material-ui/icons/LocationOn";
import Notifications from "@material-ui/icons/Notifications";
import Unarchive from "@material-ui/icons/Unarchive";
// core components/views
import DashboardPage from "views/Dashboard/Dashboard.jsx";
import Home from "views/Home/Home.jsx";
import WrapAllowance from "views/WrapAllowance/WrapAllowance.jsx";
import Typography from "views/Typography/Typography.jsx";
import Icons from "views/Icons/Icons.jsx";
import Maps from "views/Maps/Maps.jsx";
import NotificationsPage from "views/Notifications/Notifications.jsx";
import UpgradeToPro from "views/UpgradeToPro/UpgradeToPro.jsx";

const dashboardRoutes = [
  {
    path: "/home",
    sidebarName: "Home",
    navbarName: "Staked",
    icon: Dashboard,
    component: Home
  },
  {
    path: "/dashboard",
    sidebarName: "Dashboard",
    navbarName: "Staked",
    icon: Dashboard,
    component: DashboardPage
  },
  {
    path: "/wrap_allowance",
    sidebarName: "Wrap / Alloance",
    navbarName: "Wrap / Alloance",
    icon: Person,
    component: WrapAllowance
  },
  {
    path: "/orders",
    sidebarName: "Orders",
    navbarName: "Orders",
    icon: "content_paste",
    component: WrapAllowance
  },
  {
    path: "/typography",
    sidebarName: "Trade History",
    navbarName: "Trade History",
    icon: LibraryBooks,
    component: Typography
  },
  {
    path: "/icons",
    sidebarName: "Advanced",
    navbarName: "Advanced",
    icon: BubbleChart,
    component: Icons
  },
  {
    path: "/maps",
    sidebarName: "SNS",
    navbarName: "SNS",
    icon: LocationOn,
    component: Maps
  },
  /*
  {
    path: "/notifications",
    sidebarName: "Notifications",
    navbarName: "Notifications",
    icon: Notifications,
    component: NotificationsPage
  },
  */
  {
    path: "/upgrade-to-pro",
    sidebarName: "Contact",
    navbarName: "Contact",
    icon: Unarchive,
    component: UpgradeToPro
  },
  { redirect: true, path: "/", to: "/dashboard", navbarName: "Redirect" }
];

export default dashboardRoutes;
