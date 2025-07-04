import React, { useEffect, useState, useRef } from "react";
import "./App.css";

/** Color palette and accent variables for easy inline style blending */
const COLOR = {
  primary: "#1976d2",
  secondary: "#9c27b0",
  accent: "#ff9800",
};

/** Generates a default note title if title is not specified */
function defaultTitle(note, ix) {
  if (!note || !note.title) return `Untitled ${ix !== undefined ? `(#${ix + 1})` : ""}`;
  return note.title;
}

// PUBLIC_INTERFACE
function App() {
  // Theme state: 'light' or 'dark'
  const [theme, setTheme] = useState("light");
  // All user notes (localStorage-persisted)
  const [notes, setNotes] = useState([]);
  // Index of selected note or null
  const [selected, setSelected] = useState(null);
  // Current search string
  const [search, setSearch] = useState("");
  // New/editing note content (uncommitted)
  const [draft, setDraft] = useState({ title: "", content: "" });
  // Is editing an existing note?
  const [editing, setEditing] = useState(false);
  // Side effect to focus the title input when creating/editing
  const titleInputRef = useRef();
  // For responsive sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync theme to document attribute for CSS-variables
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // On first mount, load notes from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("notes-v1"));
      if (Array.isArray(saved)) {
        setNotes(saved);
      }
    } catch {}
  }, []);

  // Persist notes to localStorage whenever changed
  useEffect(() => {
    window.localStorage.setItem("notes-v1", JSON.stringify(notes));
  }, [notes]);

  // When selected note changes, update draft and editing mode
  useEffect(() => {
    if (selected === null) {
      setDraft({ title: "", content: "" });
      setEditing(false);
    } else {
      setDraft({
        title: notes[selected]?.title || "",
        content: notes[selected]?.content || "",
      });
      setEditing(true);
    }
  }, [selected]); // eslint-disable-line

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  };

  // PUBLIC_INTERFACE
  const handleNewNote = () => {
    setSelected(null);
    setDraft({ title: "", content: "" });
    setEditing(false);
    setSidebarOpen(false);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  // PUBLIC_INTERFACE
  const handleSave = () => {
    if (draft.title.trim() === "" && draft.content.trim() === "") {
      alert("Note is empty.");
      return;
    }
    if (editing && selected !== null && notes[selected]) {
      // Edit existing note
      const updated = [...notes];
      updated[selected] = {
        ...updated[selected],
        title: draft.title,
        content: draft.content,
        modified: Date.now(),
      };
      setNotes(updated);
    } else {
      // Add new note (at the top)
      setNotes([
        {
          title: draft.title,
          content: draft.content,
          created: Date.now(),
          modified: Date.now(),
        },
        ...notes,
      ]);
      setSelected(0); // Select new note
      setEditing(true);
    }
  };

  // PUBLIC_INTERFACE
  const handleDelete = () => {
    if (editing && selected != null) {
      if (!window.confirm("Delete this note?")) return;
      const updated = notes.slice();
      updated.splice(selected, 1);
      setNotes(updated);
      setSelected(null);
      setEditing(false);
      setDraft({ title: "", content: "" });
    }
  };

  // PUBLIC_INTERFACE
  const handleSelectNote = (ix) => {
    setSelected(ix);
    setSidebarOpen(false);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  // PUBLIC_INTERFACE
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Filter notes by search string (in title/content)
  const filteredNotes = notes.filter(
    (n) =>
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.content?.toLowerCase().includes(search.toLowerCase())
  );

  // For mobile, blur search on "Enter"
  function onSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.target.blur();
    }
  }

  /** Formats a date as e.g. 2023-06-01 15:04 */
  function fmt(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0") +
      " " +
      String(d.getHours()).padStart(2, "0") +
      ":" +
      String(d.getMinutes()).padStart(2, "0")
    );
  }

  // Responsive sidebar (for mobile)
  const sidebarClass =
    "ns-sidebar" + (sidebarOpen ? " ns-sidebar-open" : "");

  return (
    <div className="ns-root">
      {/* HEADER */}
      <header
        className="ns-header"
        style={{
          background: COLOR.primary,
          color: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        <button
          className="ns-sidebar-toggle"
          aria-label="Open notes"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          {/* Hamburger menu icon */}
          <span />
          <span />
          <span />
        </button>
        <span className="ns-header-logo" style={{ color: COLOR.accent }}>
          📝
        </span>
        <span className="ns-header-title"> Notenest</span>
        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>
      {/* MAIN LAYOUT */}
      <div className="ns-layout">

        {/* SIDEBAR — notes list/search */}
        <aside className={sidebarClass}>
          <div className="ns-sidebar-inner">
            <div className="ns-search">
              <input
                placeholder="Search notes..."
                value={search}
                onChange={handleSearchChange}
                onKeyDown={onSearchKeyDown}
                aria-label="Search notes"
              />
            </div>
            <div className="ns-notes-list">
              {filteredNotes.length === 0 ?
                <div className="ns-empty">No notes found.</div>
                : filteredNotes.map((note, ix) => {
                    // Find actual position in full notes array to select
                    const realIndex = notes.indexOf(note);
                    return (
                      <div
                        key={ix}
                        className={
                          "ns-note-list-item" +
                          (selected === realIndex ? " ns-note-list-item-active" : "")
                        }
                        onClick={() => handleSelectNote(realIndex)}
                        tabIndex={0}
                        aria-label={`Select note: ${defaultTitle(note, ix)}`}
                        title={note.title || "Untitled note"}
                      >
                        <div className="ns-note-title">
                          {note.title?.trim()
                            ? note.title
                            : <span className="ns-note-untitled">Untitled</span> }
                        </div>
                        <div className="ns-note-preview">
                          {(note.content || "").slice(0, 38) + ((note.content || "").length > 38 ? "..." : "")}
                        </div>
                        <div className="ns-note-date" title="Last modified">
                          {note.modified ? fmt(note.modified) : ""}
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT — note editor or new note */}
        <main className="ns-main">
          <div className="ns-main-container" role="region">
            <form
              className="ns-note-form"
              onSubmit={e => { e.preventDefault(); handleSave(); }}
              autoComplete="off"
            >
              <input
                className="ns-note-title-input"
                ref={titleInputRef}
                placeholder="Note title"
                value={draft.title}
                maxLength="60"
                onChange={e => setDraft(d => ({
                    ...d,
                    title: e.target.value
                  }))}
                aria-label="Note title"
              />
              <textarea
                className="ns-note-content-input"
                placeholder="Your note..."
                value={draft.content}
                onChange={e => setDraft(d => ({
                  ...d,
                  content: e.target.value
                }))}
                aria-label="Note content"
                rows="14"
                spellCheck
              />
              <div className="ns-note-actions">
                <button type="submit" className="ns-btn ns-btn-accent">
                  {editing ? "Save" : "Add"}
                </button>
                {editing && (
                  <button
                    className="ns-btn ns-btn-delete"
                    type="button"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
            {editing && selected != null && notes[selected] && (
              <div className="ns-note-meta">
                <div>
                  <span className="ns-note-meta-label">Created:</span>{" "}
                  {fmt(notes[selected].created)}
                </div>
                <div>
                  <span className="ns-note-meta-label">Updated:</span>{" "}
                  {fmt(notes[selected].modified)}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* FAB (floating action button) to add a new note */}
        <button
          className="ns-fab"
          style={{ background: COLOR.accent, color: "#fff" }}
          title="Create new note"
          aria-label="Create new note"
          onClick={handleNewNote}
        >
          +
        </button>
      </div>
      {/* Overlay for mobile/side nav */}
      {sidebarOpen && <div className="ns-overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}

export default App;
