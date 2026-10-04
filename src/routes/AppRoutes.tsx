import {
  Route,
  Routes,
} from "react-router-dom";

import {
  lazy,
  Suspense,
  type ReactNode,
} from "react";


/*
 * ==========================================================
 * LAZY PAGE IMPORTS
 * ==========================================================
 *
 * Pages are loaded only when the corresponding route is
 * visited.
 *
 * This keeps the initial JavaScript bundle smaller.
 */


/*
 * ----------------------------------------------------------
 * LEGAL
 * ----------------------------------------------------------
 */

const Terms =
  lazy(
    () =>
      import(
        "../pages/Legal/Terms"
      ),
  );

const PrivacyPolicy =
  lazy(
    () =>
      import(
        "../pages/Legal/PrivacyPolicy"
      ),
  );


/*
 * ----------------------------------------------------------
 * PUBLIC
 * ----------------------------------------------------------
 */

const Home =
  lazy(
    () =>
      import(
        "../pages/Home/Home"
      ),
  );

const About =
  lazy(
    () =>
      import(
        "../pages/About/About"
      ),
  );

const Products =
  lazy(
    () =>
      import(
        "../pages/Products/Products"
      ),
  );

const ProductDetails =
  lazy(
    () =>
      import(
        "../pages/Products/ProductDetails"
      ),
  );

const Printing3D =
  lazy(
    () =>
      import(
        "../pages/Printing3D/Printing3D"
      ),
  );

const MyPrintingOrders =
  lazy(
    () =>
      import(
        "../pages/Printing3D/MyPrintingOrders"
      ),
  );

const Contact =
  lazy(
    () =>
      import(
        "../pages/Contact/Contact"
      ),
  );


/*
 * ----------------------------------------------------------
 * CUSTOM SOLUTIONS
 * ----------------------------------------------------------
 */

const CustomSolutions =
  lazy(
    () =>
      import(
        "../pages/CustomSolutions/CustomSolutions"
      ),
  );

const CustomProjectRequest =
  lazy(
    () =>
      import(
        "../pages/CustomSolutions/CustomProjectRequest"
      ),
  );

const CustomProjectDetails =
  lazy(
    () =>
      import(
        "../pages/CustomSolutions/CustomProjectDetails"
      ),
  );

const CustomQuotationView =
  lazy(
    () =>
      import(
        "../pages/CustomSolutions/CustomQuotationView"
      ),
  );

const CustomProjectPayment =
  lazy(
    () =>
      import(
        "../pages/CustomSolutions/CustomProjectPayment"
      ),
  );

const CustomPortfolioDetails =
  lazy(
    () =>
      import(
        "../pages/CustomSolutions/CustomPortfolioDetails"
      ),
  );


/*
 * ----------------------------------------------------------
 * AUTH
 * ----------------------------------------------------------
 */

const Login =
  lazy(
    () =>
      import(
        "../pages/Auth/Login"
      ),
  );

const Register =
  lazy(
    () =>
      import(
        "../pages/Auth/Register"
      ),
  );


/*
 * ----------------------------------------------------------
 * CUSTOMER
 * ----------------------------------------------------------
 */

const Dashboard =
  lazy(
    () =>
      import(
        "../pages/Dashboard/Dashboard"
      ),
  );

const Cart =
  lazy(
    () =>
      import(
        "../pages/Cart/Cart"
      ),
  );

const Checkout =
  lazy(
    () =>
      import(
        "../pages/Checkout/Checkout"
      ),
  );

const CheckoutSuccess =
  lazy(
    () =>
      import(
        "../pages/Checkout/CheckoutSuccess"
      ),
  );



/*
 * ----------------------------------------------------------
 * ERROR
 * ----------------------------------------------------------
 */

const NotFound =
  lazy(
    () =>
      import(
        "../pages/NotFound"
      ),
  );


/*
 * ----------------------------------------------------------
 * ADMIN
 * ----------------------------------------------------------
 */

const AdminDashboard =
  lazy(
    () =>
      import(
        "../pages/Admin/dashboard/AdminDashboard"
      ),
  );

const ProductManager =
  lazy(
    () =>
      import(
        "../pages/Admin/products/ProductManager"
      ),
  );

const ProductForm =
  lazy(
    () =>
      import(
        "../pages/Admin/products/ProductForm"
      ),
  );

const OrderManager =
  lazy(
    () =>
      import(
        "../pages/Admin/orders/OrderManager"
      ),
  );

const CustomerManager =
  lazy(
    () =>
      import(
        "../pages/Admin/customers/CustomerManager"
      ),
  );

const PrintingDashboard =
  lazy(
    () =>
      import(
        "../pages/Admin/printing/PrintingDashboard"
      ),
  );

const PrintingSettings =
  lazy(
    () =>
      import(
        "../pages/Admin/printing/PrintingSettings"
      ),
  );

const WebsiteManager =
  lazy(
    () =>
      import(
        "../pages/Admin/website/WebsiteManager"
      ),
  );

const ContactManager =
  lazy(
    () =>
      import(
        "../pages/Admin/contacts/ContactManager"
      ),
  );

const AdminSettings =
  lazy(
    () =>
      import(
        "../pages/Admin/settings/AdminSettings"
      ),
  );


/*
 * ----------------------------------------------------------
 * ADMIN CUSTOM SOLUTIONS
 * ----------------------------------------------------------
 */

const CustomSolutionsManager =
  lazy(
    () =>
      import(
        "../pages/Admin/customSolutions/CustomSolutionsManager"
      ),
  );

const AdminCustomProjectDetails =
  lazy(
    () =>
      import(
        "../pages/Admin/customSolutions/CustomProjectDetails"
      ),
  );

const CustomQuotation =
  lazy(
    () =>
      import(
        "../pages/Admin/customSolutions/CustomQuotation"
      ),
  );

const CustomShowcaseManager =
  lazy(
    () =>
      import(
        "../pages/Admin/customSolutions/CustomShowcaseManager"
      ),
  );


/*
 * ==========================================================
 * EAGER GLOBAL COMPONENTS
 * ==========================================================
 *
 * Layouts and route guards stay eager because they are small
 * and are needed to establish the application shell.
 */

import PageLayout
  from "../components/layout/PageLayout";

import AdminLayout
  from "../components/layout/AdminLayout";

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
  children: ReactNode;
}) {

  return (
    <PageLayout>
      {children}
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
  children: ReactNode;
}) {

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}


/*
 * ==========================================================
 * LAZY ROUTE LOADING
 * ==========================================================
 */

function RouteLoading() {

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-white px-6">

      <div className="text-center">

        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-neutral-200 border-t-[#D4AF37]" />

        <p className="mt-4 text-sm font-semibold text-neutral-600">
          Loading…
        </p>

      </div>

    </div>
  );
}


/*
 * ==========================================================
 * APP ROUTES
 * ==========================================================
 */

export function AppRoutes() {

  return (

    <Suspense
      fallback={
        <RouteLoading />
      }
    >

      <Routes>

        {/* ==================================================
            PUBLIC
        =================================================== */}

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


        <Route
          path="/terms"

          element={
            <StorePage>
              <Terms />
            </StorePage>
          }
        />


        <Route
          path="/privacy"

          element={
            <StorePage>
              <PrivacyPolicy />
            </StorePage>
          }
        />


        {/* ==================================================
            CUSTOM SOLUTIONS
        =================================================== */}

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


        {/* ==================================================
            AUTH
        =================================================== */}

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


        {/* ==================================================
            PROTECTED CUSTOMER ROUTES
        =================================================== */}

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


          <Route
            path="/custom-solutions/projects/:projectId"

            element={
              <StorePage>
                <CustomProjectDetails />
              </StorePage>
            }
          />


          <Route
            path="/custom-solutions/projects/:projectId/quotation/:quotationId"

            element={
              <StorePage>
                <CustomQuotationView />
              </StorePage>
            }
          />


          <Route
            path="/custom-solutions/projects/:projectId/payment/:quotationId"

            element={
              <StorePage>
                <CustomProjectPayment />
              </StorePage>
            }
          />

        </Route>


        {/* ==================================================
            ADMIN
        =================================================== */}

        <Route
          element={
            <AdminRoute />
          }
        >

          <Route
            path="/admin"

            element={
              <AdminPage>
                <AdminDashboard />
              </AdminPage>
            }
          />


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


          <Route
            path="/admin/orders"

            element={
              <AdminPage>
                <OrderManager />
              </AdminPage>
            }
          />


          <Route
            path="/admin/customers"

            element={
              <AdminPage>
                <CustomerManager />
              </AdminPage>
            }
          />


          {/* =================================================
              3D PRINTING
          ================================================== */}

          <Route
            path="/admin/printing"

            element={
              <AdminPage>
                <PrintingDashboard />
              </AdminPage>
            }
          />


          <Route
            path="/admin/3d-printing"

            element={
              <AdminPage>
                <PrintingDashboard />
              </AdminPage>
            }
          />


          <Route
            path="/admin/printing/settings"

            element={
              <AdminPage>
                <PrintingSettings />
              </AdminPage>
            }
          />


          <Route
            path="/admin/3d-printing/settings"

            element={
              <AdminPage>
                <PrintingSettings />
              </AdminPage>
            }
          />


          {/* =================================================
              CUSTOM SOLUTIONS
          ================================================== */}

          <Route
            path="/admin/custom-solutions"

            element={
              <AdminPage>
                <CustomSolutionsManager />
              </AdminPage>
            }
          />


          <Route
            path="/admin/custom-solutions/projects/:projectId"

            element={
              <AdminPage>
                <AdminCustomProjectDetails />
              </AdminPage>
            }
          />


          <Route
            path="/admin/custom-solutions/projects/:projectId/quotation"

            element={
              <AdminPage>
                <CustomQuotation />
              </AdminPage>
            }
          />


          <Route
            path="/admin/custom-solutions/showcase"

            element={
              <AdminPage>
                <CustomShowcaseManager />
              </AdminPage>
            }
          />


          {/* =================================================
              WEBSITE
          ================================================== */}

          <Route
            path="/admin/website"

            element={
              <AdminPage>
                <WebsiteManager />
              </AdminPage>
            }
          />


          {/* =================================================
              CONTACTS
          ================================================== */}

          <Route
            path="/admin/contacts"

            element={
              <AdminPage>
                <ContactManager />
              </AdminPage>
            }
          />


          {/* =================================================
              SETTINGS
          ================================================== */}

          <Route
            path="/admin/settings"

            element={
              <AdminPage>
                <AdminSettings />
              </AdminPage>
            }
          />

        </Route>


        {/* ==================================================
            404
        =================================================== */}

        <Route
          path="*"

          element={
            <StorePage>
              <NotFound />
            </StorePage>
          }
        />

      </Routes>

    </Suspense>
  );
}


/*
 * ==========================================================
 * DEFAULT EXPORT
 * ==========================================================
 */

export default AppRoutes;