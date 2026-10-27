import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import SearchInput from "../components/ui/SearchInput";
import FilterSelect from "../components/ui/FilterSelect";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import { LoadingState, ErrorState } from "../components/ui/StateMessage";
import ContactCard from "../components/contacts/ContactCard";
import ContactFormModal from "../components/contacts/ContactFormModal";
import { useContacts, useCities, useDeleteContact } from "../hooks/useContacts";
import useDebounce from "../hooks/useDebounce";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/apiClient";

const sortOptions = [
  { value: "date", label: "Date added" },
  { value: "name", label: "Name" },
  { value: "company", label: "Company" },
  { value: "role", label: "Role" },
  { value: "city", label: "City" },
];

// Date ke liye pehle naya, baaki ke liye A-Z
const defaultOrder = (field) => (field === "date" ? "desc" : "asc");

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function Contacts() {
  const { user } = useAuth();
  const canDelete = user?.role === "admin" || user?.role === "manager";

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [sortBy, setSortBy] = useState("date");
  const [order, setOrder] = useState("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deletingContact, setDeletingContact] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const debouncedSearch = useDebounce(search);
  const { data: cities = [] } = useCities();
  const deleteContact = useDeleteContact();

  const { data, isLoading, isError, error, isPlaceholderData } = useContacts({
    search: debouncedSearch.trim() || undefined,
    city: city === "All" ? undefined : city,
    page,
    limit,
    sortBy,
    order,
  });

  const contacts = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Agar page totalPages se bada ho jaye (jaise last page ka aakhri contact delete hua) to peeche aa jao
  useEffect(() => {
    if (!isPlaceholderData && data && page > data.totalPages) {
      setPage(data.totalPages);
    }
  }, [data, isPlaceholderData, page]);

  // Search, filter ya sort badalne par hamesha page 1 se shuru
  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };
  const handleCity = (value) => {
    setCity(value);
    setPage(1);
  };
  const handleLimit = (value) => {
    setLimit(value);
    setPage(1);
  };
  const handleSortField = (field) => {
    setSortBy(field);
    setOrder(defaultOrder(field));
    setPage(1);
  };
  const toggleOrder = () => {
    setOrder((o) => (o === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const openAdd = () => {
    setEditingContact(null);
    setModalOpen(true);
  };

  const openEdit = (contact) => {
    setEditingContact(contact);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingContact(null);
  };

  const askDelete = (contact) => {
    setDeleteError("");
    setDeletingContact(contact);
  };

  const cancelDelete = () => {
    setDeletingContact(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    setDeleteError("");
    try {
      await deleteContact.mutateAsync(deletingContact.id);
      setDeletingContact(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle={`${total} contacts`}
        action={
          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            Add Contact
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search name, company, email..."
        />
        <FilterSelect label="Cities" value={city} onChange={handleCity} options={cities} />

        {/* Contacts cards mein hain (table nahi), isliye sort ka alag control */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => handleSortField(e.target.value)}
            aria-label="Sort by"
            className={`${selectClass} flex-1 sm:flex-none`}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleOrder}
            className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50"
            aria-label="Toggle sort order"
            title={order === "asc" ? "Ascending" : "Descending"}
          >
            {order === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </button>
        </div>
      </div>

      {isLoading && <LoadingState text="Loading contacts..." />}
      {isError && <ErrorState message={getErrorMessage(error)} />}
      {!isLoading &&
        !isError &&
        (contacts.length ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {contacts.map((c) => (
                <ContactCard
                  key={c.id}
                  contact={c}
                  onEdit={openEdit}
                  onDelete={askDelete}
                  canDelete={canDelete}
                />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={handleLimit}
              pageSizeOptions={[6, 9, 12, 24]}
            />
          </>
        ) : (
          <EmptyState />
        ))}

      <ContactFormModal open={modalOpen} onClose={closeModal} contact={editingContact} />

      <ConfirmDialog
        open={Boolean(deletingContact)}
        title="Delete contact"
        message={`Are you sure you want to delete "${deletingContact?.name}"? This cannot be undone.`}
        loading={deleteContact.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}