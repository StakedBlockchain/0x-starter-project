// @material-ui/icons
import Dashboard from "@material-ui/icons/Dashboard";
import Person from "@material-ui/icons/Person";
import Unarchive from "@material-ui/icons/Unarchive";
// core components/views
import Home from "views/Home/Home.jsx";
import Orders from "views/Orders/Orders.jsx";
import WrapAllowance from "views/WrapAllowance/WrapAllowance.jsx";

const dashboardRoutes = [
  {
    path: "/home",
    sidebarName: "Home",
    navbarName: "Staked",
    icon: Dashboard,
    component: Home
  },
  {
    path: "/wrap_allowance",
    sidebarName: "Wrap / Allowance",
    navbarName: "Wrap / Allowance",
    icon: Person,
    component: WrapAllowance
  },
  {
    path: "/orders",
    sidebarName: "Orders",
    navbarName: "Orders",
    icon: "content_paste",
    component: Orders
  },
  {
    path: "/contact",
    sidebarName: "Contact",
    navbarName: "Contact",
    icon: Unarchive,
    component: () => {
      window.location = 'https://m.me/sotawatanabe0426';
      return null;
    }
  },
  { redirect: true, path: "/", to: "/home", navbarName: "Redirect" }
];

export default dashboardRoutes;
