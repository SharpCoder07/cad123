import Link from "next/link";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth-guards";
import RestoreProductButton from "@/components/admin/RestoreProductButton";

export default async function RemovedProductsPage() {
  await requireAdminPermission("products.delete");

  const products = await prisma.product.findMany({
    where: {
      deletedAt: {
        not: null,
      },
    },
    include: {
      brand: true,
      category: true,
      vendor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      deletedAt: "desc",
    },
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Page heading */}
      <section className="flex flex-wrap items-center justify-between gap-4 pt-6 pb-2">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.04em] text-[#1F2430]">
            Removed Products
          </h1>
          <p className="mt-2 text-[14px] text-[#77808E]">
            View and restore products removed from your catalog.
          </p>
        </div>

        <Link
          href="/admin/products"
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </section>

      {/* Removed products count */}
      <section className="rounded-[21px] border border-white/85 bg-gradient-to-br from-[#FCEBF0] via-[#FAF4F9] to-[#F7F0FC] px-5 py-5 shadow-[0_10px_30px_rgba(52,43,74,0.045)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-wide text-[#66707F]">
              Total Removed Products
            </p>
            <p className="mt-3 text-[30px] font-semibold tracking-[-0.055em] text-[#18202D]">
              {products.length.toLocaleString("en-IN")}
            </p>
          </div>

          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EBDEFA] text-[#76599B]">
            <Trash2 size={20} />
          </span>
        </div>
      </section>

      {/* Products table */}
      <section className="overflow-hidden rounded-[24px] border border-[#E8EAED] bg-white shadow-[0_5px_25px_rgba(15,23,42,0.025)]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-[15px] font-semibold text-[#1F2430]">
              Removed Product Catalog
            </h2>
            <p className="mt-1 text-[12px] text-[#77808E]">
              Restore products to make them available in the catalog again.
            </p>
          </div>
          <RotateCcw size={19} className="text-[#77808E]" />
        </div>

        {products.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F1F7] text-[#8A7A9F]">
              <Trash2 size={23} />
            </span>

            <h3 className="mt-4 text-[15px] font-semibold text-[#1F2430]">
              No removed products
            </h3>

            <p className="mt-2 text-[13px] text-[#77808E]">
              Products you remove will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAFB]">
                  {[
                    "Product",
                    "Brand",
                    "Category",
                    "Removed On",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition hover:bg-[#FAFAFB]"
                  >
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-semibold text-[#1F2430]">
                        {product.name}
                      </p>
                      <p className="mt-1 text-[12px] text-[#77808E]">
                        {product.slug}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-[13px] text-[#555D6B]">
                      {product.brand.name}
                    </td>

                    <td className="px-5 py-4 text-[13px] text-[#555D6B]">
                      {product.category.name}
                    </td>

                    <td className="px-5 py-4 text-[12px] text-[#77808E]">
                      {product.deletedAt
                        ? product.deletedAt.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            timeZone: "Asia/Kolkata",
                          })
                        : "N/A"}
                    </td>

                    <td className="px-5 py-4">
                      <RestoreProductButton productId={product.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}