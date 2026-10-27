import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import SearchInput from "../components/ui/SearchInput";
import FilterSelect from "../components/ui/FilterSelect";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import { LoadingState, ErrorState } from "../components/ui/StateMessage";
import LeadsTable from "../components/leads/LeadsTable";
import LeadFormModal from "../components/leads/LeadFormModal";
import FollowUpModal from "../components/leads/FollowUpModal";
import { leadStatuses, leadSources } from "../constants/lead";
import { useLeads, useDeleteLead } from "../hooks/useLeads";
import useDebounce from "../hooks/useDebounce";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/apiClient";

const sortOptions = [
  { value: "date", label: "Date" },
  { value: "name", label: "Name" },
  { value: "company", label: "Company" },
  { value: "status", label: "Status" },
  { value: "source", label: "Source" },
  { value: "value", label: "Value" },
  { value: "owner", label: "Owner" },
];

// Value aur date ke liye pehle bada/naya, baaki ke liye A-Z
const defaultOrder = (field) => (field === "value" || field === "date" ? "desc" : "asc");

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function Leads() {
  const { user } = useAuth();
  const canDelete = user?.role === "admin" || user?.role === "manager";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [source, setSource] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("date");
  const [order, setOrder] = useState("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [draftingLead, setDraftingLead] = useState(null);

  const debouncedSearch = useDebounce(search);
  const deleteLead = useDeleteLead();

  const { data, isLoading, isError, error, isPlaceholderData } = useLeads({
    search: debouncedSearch.trim() || undefined,
    status: status === "All" ? undefined : status,
    source: source === "All" ? undefined : source,
    page,
    limit,
    sortBy,
    order,
  });

  const leads = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = search || status !== "All" || source !== "All";

  // Agar page totalPages se bada ho jaye (jaise last page ki aakhri lead delete hui) to peeche aa jao
  useEffect(() => {
    if (!isPlaceholderData && data && page > data.totalPages) {
      setPage(data.totalPages);
    }
  }, [data, isPlaceholderData, page]);

  // Filter, search ya sort badalne par hamesha page 1 se shuru
  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };
  const handleStatus = (value) => {
    setStatus(value);
    setPage(1);
  };
  const handleSource = (value) => {
    setSource(value);
    setPage(1);
  };
  const handleLimit = (value) => {
    setLimit(value);
    setPage(1);
  };
  const handleSort = (field) => {
    if (field === sortBy) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setOrder(defaultOrder(field));
    }
    setPage(1);
  };
  const toggleOrder = () => {
    setOrder((o) => (o === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("All");
    setSource("All");
    setPage(1);
  };

  const openAdd = () => {
    setEditingLead(null);
    setModalOpen(true);
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingLead(null);
  };

  const askDelete = (lead) => {
    setDeleteError("");
    setDeletingLead(lead);
  };

  const cancelDelete = () => {
    setDeletingLead(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    setDeleteError("");
    try {
      await deleteLead.mutateAsync(deletingLead.id);
      setDeletingLead(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle={`${total} leads`}
        action={
          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            Add Lead
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search name, company, email..."
        />
        <FilterSelect
          label="Statuses"
          value={status}
          onChange={handleStatus}
          options={leadStatuses}
        />
        <FilterSelect
          label="Sources"
          value={source}
          onChange={handleSource}
          options={leadSources}
        />

        {/* Mobile par table headers nahi hote, isliye sort ka alag control */}
        <div className="flex items-center gap-2 md:hidden">
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            aria-label="Sort by"
            className={`${selectClass} flex-1`}
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
          >
            {order === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </button>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading && <LoadingState text="Loading leads..." />}
      {isError && <ErrorState message={getErrorMessage(error)} />}
      {!isLoading &&
        !isError &&
        (leads.length ? (
          <>
            <LeadsTable
              leads={leads}
              onEdit={openEdit}
              onDelete={askDelete}
              onDraft={setDraftingLead}
              canDelete={canDelete}
              sortBy={sortBy}
              order={order}
              onSort={handleSort}
            />
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={handleLimit}
            />
          </>
        ) : (
          <EmptyState />
        ))}

      <LeadFormModal open={modalOpen} onClose={closeModal} lead={editingLead} />

      <FollowUpModal
        open={Boolean(draftingLead)}
        lead={draftingLead}
        onClose={() => setDraftingLead(null)}
      />

      <ConfirmDialog
        open={Boolean(deletingLead)}
        title="Delete lead"
        message={`Are you sure you want to delete "${deletingLead?.name}"? This cannot be undone.`}
        loading={deleteLead.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}