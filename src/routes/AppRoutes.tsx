import {
  Route,
  Routes,
} from "react-router-dom";

import type {
  ReactNode,
} from "react";


/*
 * ==========================================================
 * LAYOUTS
 * ==========================================================
 */

import PageLayout
  from "../components/layout/PageLayout";

import AdminLayout
  from "../components/layout/AdminLayout";


/*
 * ==========================================================
 * PUBLIC PAGES
 * ==========================================================
 */

import Home
  from "../pages/Home/Home";

import About
  from "../pages/About/About";

import Products
  from "../pages/Products/Products";

import ProductDetails
  from "../pages/Products/ProductDetails";

import Printing3D
  from "../pages/Printing3D/Printing3D";

import MyPrintingOrders
  from "../pages/Printing3D/MyPrintingOrders";

import Contact
  from "../pages/Contact/Contact";


/*
 * ==========================================================
 * CUSTOM SOLUTIONS
 * ==========================================================
 */

import CustomSolutions
  from "../pages/CustomSolutions/CustomSolutions";

import CustomProjectRequest
  from "../pages/CustomSolutions/CustomProjectRequest";

import CustomProjectDetails
  from "../pages/CustomSolutions/CustomProjectDetails";

import CustomQuotationView
  from "../pages/CustomSolutions/CustomQuotationView";

import CustomProjectPayment
  from "../pages/CustomSolutions/CustomProjectPayment";

import CustomPortfolioDetails
  from "../pages/CustomSolutions/CustomPortfolioDetails";


/*
 * ==========================================================
 * AUTH
 * ==========================================================
 */

import Login
  from "../pages/Auth/Login";

import Register
  from "../pages/Auth/Register";


/*
 * ==========================================================
 * CUSTOMER
 * ==========================================================
 */

import Dashboard
  from "../pages/Dashboard/Dashboard";

import Cart
  from "../pages/Cart/Cart";

import Checkout
  from "../pages/Checkout/Checkout";

import CheckoutSuccess
  from "../pages/Checkout/CheckoutSuccess";


/*
 * ==========================================================
 * ERROR
 * ==========================================================
 */

import NotFound
  from "../pages/NotFound";


/*
 * ==========================================================
 * ADMIN
 * ==========================================================
 */

import AdminDashboard
  from "../pages/Admin/dashboard/AdminDashboard";

import ProductManager
  from "../pages/Admin/products/ProductManager";

import ProductForm
  from "../pages/Admin/products/ProductForm";

import OrderManager
  from "../pages/Admin/orders/OrderManager";

import CustomerManager
  from "../pages/Admin/customers/CustomerManager";

import PrintingDashboard
  from "../pages/Admin/printing/PrintingDashboard";

import PrintingSettings
  from "../pages/Admin/printing/PrintingSettings";

import WebsiteManager
  from "../pages/Admin/website/WebsiteManager";

import ContactManager
  from "../pages/Admin/contacts/ContactManager";

import AdminSettings
  from "../pages/Admin/settings/AdminSettings";


/*
 * ==========================================================
 * ADMIN CUSTOM SOLUTIONS
 * ==========================================================
 */

import CustomSolutionsManager
  from "../pages/Admin/customSolutions/CustomSolutionsManager";

import AdminCustomProjectDetails
  from "../pages/Admin/customSolutions/CustomProjectDetails";

import CustomQuotation
  from "../pages/Admin/customSolutions/CustomQuotation";

import CustomShowcaseManager
  from "../pages/Admin/customSolutions/CustomShowcaseManager";


/*
 * ==========================================================
 * ROUTE GUARDS
 * ==========================================================
 */

import ProtectedRoute
  from "./ProtectedRoute";

import AdminRoute
  from "./AdminRoute";


/*
 * ==========================================================
 * STORE PAGE
 * ==========================================================
 */

function StorePage({
  children,
}: {
  children:
    ReactNode;
}) {

  return (

    <PageLayout>

      {
        children
      }

    </PageLayout>
  );
}


/*
 * ==========================================================
 * ADMIN PAGE
 * ==========================================================
 */

function AdminPage({
  children,
}: {
  children:
    ReactNode;
}) {

  return (

    <AdminLayout>

      {
        children
      }

    </AdminLayout>
  );
}


/*
 * ==========================================================
 * APP ROUTES
 * ==========================================================
 */

export function AppRoutes() {

  return (

    <Routes>

      {/* ====================================================
          PUBLIC
      ===================================================== */}

      <Route
        path="/"

        element={
          <StorePage>
            <Home />
          </StorePage>
        }
      />


      <Route
        path="/about"

        element={
          <StorePage>
            <About />
          </StorePage>
        }
      />


      <Route
        path="/products"

        element={
          <StorePage>
            <Products />
          </StorePage>
        }
      />


      <Route
        path="/products/:id"

        element={
          <StorePage>
            <ProductDetails />
          </StorePage>
        }
      />


      <Route
        path="/3d-printing"

        element={
          <StorePage>
            <Printing3D />
          </StorePage>
        }
      />


      <Route
        path="/contact"

        element={
          <StorePage>
            <Contact />
          </StorePage>
        }
      />


      {/* ====================================================
          CUSTOM SOLUTIONS
      ===================================================== */}

      <Route
        path="/custom-solutions"

        element={
          <StorePage>
            <CustomSolutions />
          </StorePage>
        }
      />


      <Route
        path="/custom-solutions/request"

        element={
          <StorePage>
            <CustomProjectRequest />
          </StorePage>
        }
      />


      <Route
        path="/custom-solutions/work/:projectId"

        element={
          <StorePage>
            <CustomPortfolioDetails />
          </StorePage>
        }
      />


      {/* ====================================================
          AUTH
      ===================================================== */}

      <Route
        path="/login"

        element={
          <StorePage>
            <Login />
          </StorePage>
        }
      />


      <Route
        path="/register"

        element={
          <StorePage>
            <Register />
          </StorePage>
        }
      />


      {/* ====================================================
          CUSTOMER ROUTES
      ===================================================== */}

      <Route
        element={
          <ProtectedRoute />
        }
      >

        <Route
          path="/dashboard"

          element={
            <StorePage>
              <Dashboard />
            </StorePage>
          }
        />


        <Route
          path="/cart"

          element={
            <StorePage>
              <Cart />
            </StorePage>
          }
        />


        <Route
          path="/checkout"

          element={
            <StorePage>
              <Checkout />
            </StorePage>
          }
        />


        <Route
          path="/checkout/success"

          element={
            <StorePage>
              <CheckoutSuccess />
            </StorePage>
          }
        />


        <Route
          path="/3d-printing/orders"

          element={
            <StorePage>
              <MyPrintingOrders />
            </StorePage>
          }
        />


        {/* CUSTOM PROJECT */}

        <Route
          path="/custom-solutions/projects/:projectId"

          element={
            <StorePage>
              <CustomProjectDetails />
            </StorePage>
          }
        />


        {/* CUSTOMER QUOTATION */}

        <Route
          path="/custom-solutions/projects/:projectId/quotation/:quotationId"

          element={
            <StorePage>
              <CustomQuotationView />
            </StorePage>
          }
        />


        {/* CUSTOMER PAYMENT */}

        <Route
          path="/custom-solutions/projects/:projectId/payment/:quotationId"

          element={
            <StorePage>
              <CustomProjectPayment />
            </StorePage>
          }
        />

      </Route>


      {/* ====================================================
          ADMIN
      ===================================================== */}

      <Route
        element={
          <AdminRoute />
        }
      >

        {/* ==================================================
            DASHBOARD
        =================================================== */}

        <Route
          path="/admin"

          element={
            <AdminPage>
              <AdminDashboard />
            </AdminPage>
          }
        />


        {/* ==================================================
            PRODUCTS
        =================================================== */}

        <Route
          path="/admin/products"

          element={
            <AdminPage>
              <ProductManager />
            </AdminPage>
          }
        />


        <Route
          path="/admin/products/new"

          element={
            <AdminPage>
              <ProductForm />
            </AdminPage>
          }
        />


        <Route
          path="/admin/products/:productId/edit"

          element={
            <AdminPage>
              <ProductForm />
            </AdminPage>
          }
        />


        {/* ==================================================
            ORDERS
        =================================================== */}

        <Route
          path="/admin/orders"

          element={
            <AdminPage>
              <OrderManager />
            </AdminPage>
          }
        />


        {/* ==================================================
            CUSTOMERS
        =================================================== */}

        <Route
          path="/admin/customers"

          element={
            <AdminPage>
              <CustomerManager />
            </AdminPage>
          }
        />


        {/* ==================================================
            3D PRINTING
        =================================================== */}

        {/* Current route */}

        <Route
          path="/admin/printing"

          element={
            <AdminPage>
              <PrintingDashboard />
            </AdminPage>
          }
        />


        {/* Alias used by your sidebar/browser URL */}

        <Route
          path="/admin/3d-printing"

          element={
            <AdminPage>
              <PrintingDashboard />
            </AdminPage>
          }
        />


        {/* Printing settings */}

        <Route
          path="/admin/printing/settings"

          element={
            <AdminPage>
              <PrintingSettings />
            </AdminPage>
          }
        />


        {/* Settings alias */}

        <Route
          path="/admin/3d-printing/settings"

          element={
            <AdminPage>
              <PrintingSettings />
            </AdminPage>
          }
        />


        {/* ==================================================
            CUSTOM SOLUTIONS
        =================================================== */}

        <Route
          path="/admin/custom-solutions"

          element={
            <AdminPage>
              <CustomSolutionsManager />
            </AdminPage>
          }
        />


        {/* ==================================================
            CUSTOM PROJECT DETAILS
        =================================================== */}

        <Route
          path="/admin/custom-solutions/projects/:projectId"

          element={
            <AdminPage>
              <AdminCustomProjectDetails />
            </AdminPage>
          }
        />


        {/* ==================================================
            CUSTOM QUOTATION
        =================================================== */}

        <Route
          path="/admin/custom-solutions/projects/:projectId/quotation"

          element={
            <AdminPage>
              <CustomQuotation />
            </AdminPage>
          }
        />


        {/* ==================================================
            SHOWCASE
        =================================================== */}

        <Route
          path="/admin/custom-solutions/showcase"

          element={
            <AdminPage>
              <CustomShowcaseManager />
            </AdminPage>
          }
        />


        {/* ==================================================
            WEBSITE
        =================================================== */}

        <Route
          path="/admin/website"

          element={
            <AdminPage>
              <WebsiteManager />
            </AdminPage>
          }
        />


        {/* ==================================================
            ENQUIRIES
        =================================================== */}

        <Route
          path="/admin/contacts"

          element={
            <AdminPage>
              <ContactManager />
            </AdminPage>
          }
        />


        {/* ==================================================
            SETTINGS
        =================================================== */}

        <Route
          path="/admin/settings"

          element={
            <AdminPage>
              <AdminSettings />
            </AdminPage>
          }
        />

      </Route>


      {/* ====================================================
          404
      ===================================================== */}

      <Route
        path="*"

        element={
          <StorePage>
            <NotFound />
          </StorePage>
        }
      />

    </Routes>
  );
}


/*
 * ==========================================================
 * DEFAULT EXPORT
 * ==========================================================
 */

export default AppRoutes;