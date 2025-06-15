import React from 'react';
import { Icon, layout } from '@chakra-ui/react';
import {
  MdHome,
  MdOutlineShoppingCart,
  MdInventory,
  MdAssignment,
} from 'react-icons/md';

import { MdAdminPanelSettings } from 'react-icons/md';
import { TiMinus } from 'react-icons/ti';
import { FaMoneyBill1, FaRegCalendarDays } from 'react-icons/fa6';
import { RiLogoutCircleLine } from "react-icons/ri";

// Admin Imports
import MainDashboard from 'views/admin/default';
import Admins from 'views/admin/admins/Admins';
import AddAdmin from 'views/admin/admins/AddAdmin';
import Roles from 'views/admin/roles/Roles';
import AddRole from 'views/admin/roles/AddRole';
import Presecibtions from 'views/admin/presecibtions/Presecibtions';
import AddPresecibtions from 'views/admin/presecibtions/AddPresecibtions';
import ProtectedRoute from 'components/protectedRoute/ProtectedRoute';
import EditRole from 'views/admin/roles/EditRole';

import EditAdmin from 'views/admin/admins/EditAdmin';
import ShowAdmin from 'views/admin/admins/ShowAdmin';
import Orders from 'views/admin/orders/Orders';
import Products from 'views/admin/products/Products';
import ShowProduct from 'views/admin/products/ShowProduct';
import EditProduct from 'views/admin/products/EditProduct';
import AddProduct from 'views/admin/products/AddProduct';
import PromoCodes from 'views/admin/promoCodes/PromoCodes';
import AddPromoCode from 'views/admin/promoCodes/AddPromoCode';
import EditPromoCode from 'views/admin/promoCodes/EditPromoCode';
import { CiDiscount1 } from 'react-icons/ci';
import DeliveryFees from 'views/admin/deliveryFees/DeliveryFees';


const routes = [
  {
    name: 'Super Admin',
    layout: '/admin',
    path: '/dashboard',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component:<ProtectedRoute><MainDashboard /></ProtectedRoute> ,
    showInSidebar: true,
  },
  /* Start Admin Routes */
  // {
  //   name: 'Admin Management',
  //   layout: '/admin',
  //   icon: (
  //     <Icon
  //     as={MdAdminPanelSettings}
  //     width="20px"
  //     height="20px"
  //     color="#8f9bba"
  //     />
  //   ),
  //   component: null,
  //   showInSidebar: true,
  //   subRoutes: [
  //     {
  //       name: 'Admins',
  //       path: '/admins',
  //       icon: <Icon as={TiMinus} width="20px" height="20px" color="inherit" />,
  //       component: <Admins />,
  //       showInSidebar: true,
  //     },
  //     {
  //       name: 'Rules',
  //       path: '/rules',
  //       icon: <Icon as={TiMinus} width="20px" height="20px" color="inherit" />,
  //       component: <Roles />,
  //       showInSidebar: true,
  //     },
  //   ],
  // },
  // {
  //   name: 'Admin Management',
  //   layout: '/admin',
  //   path: '/add-New-Rule',
  //   icon: (
  //     <Icon as={FaRegCalendarDays} width="20px" height="20px" color="inherit" />
  //   ),
  //   component: <AddRole />,
  //   showInSidebar: false,
  // },
  // {
  //   name: 'Admin Management',
  //   layout: '/admin',
  //   path: '/edit/rule/:id',
  //   icon: (
  //     <Icon as={FaRegCalendarDays} width="20px" height="20px" color="inherit" />
  //   ),
  //   component: <EditRole />,
  //   showInSidebar: false,
  // },
  // {
  //   name: 'Admin Management',
  //   layout: '/admin',
  //   path: '/add-admin',
  //   component: <AddAdmin />,
  //   showInSidebar: false,
  // },
  // {
  //   name: 'Admin Management',
  //   layout: '/admin',
  //   path: '/edit-admin/:id',
  //   component: <EditAdmin />,
  //   showInSidebar: false,
  // },
  // {
  //   name: 'Admin Management',
  //   layout: '/admin',
  //   path: '/admin/details/:id',
  //   component: <ShowAdmin />,
  //   showInSidebar: false,
  // },
  /* End Admin Routes */
  {
    name: 'Products',
    layout: '/admin',
    path: '/products',
    icon: <Icon as={MdInventory} width="20px" height="20px" color="inherit" />,
    component: <Products />,
    showInSidebar: true,
  },
  {
    name: 'Products',
    layout: '/admin',
    path: '/products/:id',
    icon: <Icon as={MdInventory} width="20px" height="20px" color="inherit" />,
    component: <ShowProduct />,
    showInSidebar: false,
  },
  {
    name: 'Products',
    layout: '/admin',
    path: '/edit-product/:id',
    icon: <Icon as={MdInventory} width="20px" height="20px" color="inherit" />,
    component: <EditProduct />,
    showInSidebar: false,
  },
  {
    name: 'Products',
    layout: '/admin',
    path: '/add-product',
    component: <AddProduct />,
    showInSidebar: false,
  },
  {
    name: 'Orders',
    layout: '/admin',
    path: '/orders',
    icon: (
      <Icon
        as={MdOutlineShoppingCart}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <Orders />,
    showInSidebar: true,
  },
  {
    name: 'Prescription',
    layout: '/admin',
    path: '/prescription',
    icon: <Icon as={MdAssignment} width="20px" height="20px" color="inherit" />,
    component: <Presecibtions />,
    showInSidebar: true,
  },
  {
    name: 'Prescription',
    layout: '/admin',
    path: '/add-prescription/:id',
    icon: <Icon as={MdAssignment} width="20px" height="20px" color="inherit" />,
    component: <AddPresecibtions />,
    showInSidebar: false,
  },
  {
    name: 'Promo Codes',
    layout: '/admin',
    path: '/promo-codes',
    icon: <Icon as={CiDiscount1} width="20px" height="20px" color="inherit" />,
    component: <PromoCodes />,
    showInSidebar: true,
  },
  {
    name: 'Promo Codes',
    layout: '/admin',
    path: '/add-promo-code',
    component: <AddPromoCode />,
    showInSidebar: false,
  },
  {
    name: 'Promo Codes',
    layout: '/admin',
    path: '/edit-promo-code/:id',
    component: <EditPromoCode />,
    showInSidebar: false,
  },
  {
    name: 'Delivery Fees',
    layout: '/admin',
    path: '/delivery-fees',
    icon: <Icon as={FaMoneyBill1} width="20px" height="20px" color="inherit" />,
    component: <DeliveryFees />,
    showInSidebar: true,
  },
  {
    name: "Logout",
    path: "/logout",
    icon: <RiLogoutCircleLine />, // Add an appropriate icon
    layout: "/admin", // Adjust the layout as needed
    showInSidebar: true,
  },
  
];

export default routes;
