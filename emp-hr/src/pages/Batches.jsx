import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getBatch,
  createBatch,
  deleteBatch,
  getSession,
  createSession,
  updateSession,
  deleteSession,
} from "../components/Api";

import { GrFormViewHide } from "react-icons/gr";
import { BiShowAlt } from "react-icons/bi";
import { MdDeleteSweep } from "react-icons/md";
import { MdCreateNewFolder } from "react-icons/md";
import { IoChevronBackOutline } from "react-icons/io5";
import { addDays, format } from "date-fns";
import useUser from "../hooks/useUser";

const Batches = () => {
  const { programId } = useParams();
  const [batches, setBatches] = useState([]);
  const navigate = useNavigate();
  const { user } = useUser();
  const userEmail = user ? user['Work email']:'' ;
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [formBatch, setFormBatch] = useState({
    batchNumber: "",
    startDate: "",
    endDate: "",
  });
 const allowedEditors = [
    "divya.tayade@esromagica.com",
    "cso@esromagica.com",
    "ceo@esromagica.com",
    "cdse01@esromagica.com",
    "emcapex01@esromagica.com",
    "emcscc006@esromagica.com",
    "ser002@esromagica.com",
    "ser001@esromagica.com"
  ];
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [sessions, setSessions] = useState({});
  const [formSession, setFormSession] = useState({
    date: "",
    dayNumber: "",
    sessionTime: "",
    meetingLink: "",
    assignedTutor: "",
    assignedCounselor: "",
    quizLink: "",
    counselingLink: "",
  });
  const [editSession, setEditSession] = useState(null);

  // -------------------- Fetch Batches --------------------
  const fetchBatches = async () => {
    try {
      const allBatches = await getBatch();
      const filtered = allBatches.filter(
        (batch) => batch.program === programId || batch.program?._id === programId
      );
      setBatches(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [programId]);

  // -------------------- Batch Handlers --------------------
  const handleBatchChange = (e) => {
    setFormBatch({ ...formBatch, [e.target.name]: e.target.value });
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBatch({ ...formBatch, program: programId });
      fetchBatches();
      setFormBatch({ batchNumber: "", startDate: "", endDate: "" });
      setShowBatchModal(false);
    } catch (err) {
      console.error(err);
      alert("Error creating batch");
    }
  };

  const handleDeleteBatch = async (batchId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this batch?");
    if (!confirmDelete) return;

    try {
      await deleteBatch(batchId);
      fetchBatches();
      alert("Batch deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Error deleting batch");
    }
  };

  // -------------------- Session Handlers --------------------
  const fetchSessions = async (batchId) => {
    try {
      const allSessions = await getSession();
      const batchSessions = allSessions.filter(
        (session) => session.batch === batchId || session.batch?._id === batchId
      );
      setSessions((prev) => ({ ...prev, [batchId]: batchSessions }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSessionChange = (e) => {
    setFormSession({ ...formSession, [e.target.name]: e.target.value });
  };

  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editSession) {
        await updateSession(editSession._id, formSession);
        setEditSession(null);
      } else {
        await createSession({ ...formSession, batch: selectedBatchId });
      }
      fetchSessions(selectedBatchId);
      setFormSession({
        date: "",
        dayNumber: "",
        sessionTime: "",
        meetingLink: "",
        assignedTutor: "",
        assignedCounselor: "",
        quizLink: "",
        counselingLink: "",
      });
      setShowSessionModal(false);
    } catch (err) {
      console.error(err);
      alert("Error saving session");
    }
  };

  const handleEditSession = (batchId, session) => {
    setSelectedBatchId(batchId);
    setFormSession({
      date: session.date.split("T")[0],
      dayNumber: session.dayNumber,
      sessionTime: session.sessionTime,
      meetingLink: session.meetingLink,
      assignedTutor: session.assignedTutor,
      assignedCounselor: session.assignedCounselor,
      quizLink: session.quizLink,
      counselingLink: session.counselingLink,
    });
    setEditSession(session);
    setShowSessionModal(true);
  };

  const handleDeleteSession = async (batchId, sessionId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this session?");
    if (!confirmDelete) return;

    try {
      await deleteSession(sessionId);
      fetchSessions(batchId);
      alert("Session deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Error deleting session");
    }
  };

  // -------------------- Auto-create Batch (Runs automatically) --------------------
  const createWeeklyBatch = async () => {
    try {
      let nextBatchNumber = 1;
      let lastBatch = null;

      if (batches.length > 0) {
        const sortedBatches = batches
          .map((b) => ({ ...b, num: parseInt(b.batchNumber.replace("batch", "")) }))
          .sort((a, b) => a.num - b.num);
        lastBatch = sortedBatches[sortedBatches.length - 1];
        nextBatchNumber = lastBatch.num + 1;
      }

      const startDate = lastBatch ? addDays(new Date(lastBatch.endDate), 1) : new Date();
      const endDate = addDays(startDate, 6);

      const newBatch = {
        batchNumber: `batch${nextBatchNumber}`,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        program: lastBatch ? lastBatch.program._id : programId,
      };

      const createdBatch = await createBatch(newBatch);

      // Auto-create sessions (Monday & Thursday)
      const sessionDays = [1, 4];
      let dayCounter = 1;

      for (let i = 0; i <= 6; i++) {
        const sessionDate = addDays(startDate, i);
        if (sessionDays.includes(sessionDate.getDay())) {
          const newSession = {
            batch: createdBatch._id,
            date: format(sessionDate, "yyyy-MM-dd"),
            dayNumber: dayCounter,
            sessionTime: "10:00 AM",
            meetingLink: "",
            assignedTutor: "",
            assignedCounselor: "",
            quizLink: "",
            counselingLink: "",
          };
          await createSession(newSession);
          dayCounter++;
        }
      }

      fetchBatches();
      console.log(`Auto-created batch ${newBatch.batchNumber} with sessions.`);
    } catch (err) {
      console.error("Error creating weekly batch:", err);
    }
  };

 

  return (
    <div className="container mx-auto mt-8 px-4 bg-white min-h-screen p-2">
      {/* -------------------- Header -------------------- */}
      <div className="flex justify-between items-center mb-6">
        <h5
          className="font-bold flex flex-row items-center cursor-pointer"
          onClick={() => navigate("/workshop")}
        >
          <IoChevronBackOutline /> Back
        </h5>
        <h2 className="text-3xl font-bold text-gray-800">Batches</h2>
        {allowedEditors.includes(userEmail) && ( <button
          onClick={() => setShowBatchModal(true)}
          className="px-4 py-2 bg-blue-600 flex flex-row items-center text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          <MdCreateNewFolder/> <span className="hidden md:block ml-3">Create Batch</span>
        </button>)}
      </div>

      {/* -------------------- Batch Modal -------------------- */}
      {showBatchModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <h3 className="text-xl font-bold mb-4">Create Batch</h3>
            <button
              onClick={() => setShowBatchModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold"
            >
              ✕
            </button>
            <form onSubmit={handleBatchSubmit}>
              <input
                type="text"
                name="batchNumber"
                placeholder="Batch Number"
                value={formBatch.batchNumber}
                onChange={handleBatchChange}
                className="w-full mb-3 px-3 py-2 border rounded"
              />
              <input
                type="date"
                name="startDate"
                value={formBatch.startDate}
                onChange={handleBatchChange}
                className="w-full mb-3 px-3 py-2 border rounded"
              />
              <input
                type="date"
                name="endDate"
                value={formBatch.endDate}
                onChange={handleBatchChange}
                className="w-full mb-3 px-3 py-2 border rounded"
              />
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">
                Create Batch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- Display Batches -------------------- */}
      <div className="space-y-4">
        {batches.map((batch) => (
          <div key={batch._id} className="bg-gray-50 p-4 rounded shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">{batch.batchNumber}</h3>
                <p>
                  {new Date(batch.startDate).toLocaleDateString()} -{" "}
                  {new Date(batch.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (sessions[batch._id]) {
                      setSessions((prev) => {
                        const updated = { ...prev };
                        delete updated[batch._id];
                        return updated;
                      });
                    } else {
                      setSelectedBatchId(batch._id);
                      fetchSessions(batch._id);
                    }
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded flex flex-row items-center"
                >
                  {sessions[batch._id] ? <>< BiShowAlt /><span className="hidden md:block ml-2">Hide Sessions</span></> : <><GrFormViewHide/><span className="hidden md:block ml-2">Show Sessions</span></>}
                </button>
               
                 {allowedEditors.includes(userEmail) && ( <button
                  onClick={() => handleDeleteBatch(batch._id)}
                  className="px-3 py-1 flex flex-row items-center bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <MdDeleteSweep/><span className="hidden md:block ml-2"> Delete</span>
                </button>)}
              </div>
            </div>

            {/* -------------------- Sessions -------------------- */}
            {sessions[batch._id] && (
              <div className="mt-3 space-y-2 border-t pt-2">
                 {allowedEditors.includes(userEmail) && ( <button
                  onClick={() => {
                    setSelectedBatchId(batch._id);
                    setShowSessionModal(true);
                    setEditSession(null);
                    setFormSession({
                      date: "",
                      dayNumber: "",
                      sessionTime: "",
                      meetingLink: "",
                      assignedTutor: "",
                      assignedCounselor: "",
                      quizLink: "",
                      counselingLink: "",
                    });
                  }}
                  className="px-3 py-1 bg-green-500 text-white rounded"
                >
                  + Add Session
                </button>)}

                {sessions[batch._id].map((session) => (
                  <div
                    key={session._id}
                    className="bg-white p-2 rounded shadow mt-2 flex flex-col sm:flex-row sm:justify-between"
                  >
                    <div className="flex flex-col justify-start items-start px-2 space-y-1 ">
                      <p>Day {session.dayNumber}</p>
                      <p>Date: {new Date(session.date).toLocaleDateString()}</p>
                      <p>Time: {session.sessionTime}</p>
                      <p>
                        Quiz Link:{" "}
                        <a
                          href={session.quizLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline break-all"
                        >
                          {session.quizLink}
                        </a>
                      </p>
                      <p>
                        Counselling Link:{" "}
                        <a
                          href={session.counselingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline break-all"
                        >
                          {session.counselingLink}
                        </a>
                      </p>
                      <p>
                        Meeting Link:{" "}
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline break-all"
                        >
                          {session.meetingLink}
                        </a>
                      </p>
                      <p>Tutor: {session.assignedTutor}</p>
                      <p>Counsellor: {session.assignedCounselor}</p>
                    </div>

                     {allowedEditors.includes(userEmail) && ( <div className="flex gap-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => handleEditSession(batch._id, session)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSession(batch._id, session._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* -------------------- Session Modal -------------------- */}
      {showSessionModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <h3 className="text-xl font-bold mb-4">
              {editSession ? "Edit Session" : "Create Session"}
            </h3>
            <button
              onClick={() => setShowSessionModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold"
            >
              ✕
            </button>
            <form onSubmit={handleSessionSubmit} className="space-y-2">
              <input
                type="date"
                name="date"
                value={formSession.date}
                onChange={handleSessionChange}
                className="w-full mb-2 px-3 py-2 border rounded"
                required
              />
              <input
                type="number"
                name="dayNumber"
                value={formSession.dayNumber}
                onChange={handleSessionChange}
                className="w-full mb-2 px-3 py-2 border rounded"
                placeholder="Day Number"
                required
              />
              <input
                type="text"
                name="sessionTime"
                value={formSession.sessionTime}
                onChange={handleSessionChange}
                placeholder="Session Time"
                className="w-full mb-2 px-3 py-2 border rounded"
              />
              <input
                type="text"
                name="meetingLink"
                value={formSession.meetingLink}
                onChange={handleSessionChange}
                placeholder="Meeting Link"
                className="w-full mb-2 px-3 py-2 border rounded"
              />
              <input
                type="text"
                name="assignedTutor"
                value={formSession.assignedTutor}
                onChange={handleSessionChange}
                placeholder="Tutor"
                className="w-full mb-2 px-3 py-2 border rounded"
              />
              <input
                type="text"
                name="assignedCounselor"
                value={formSession.assignedCounselor}
                onChange={handleSessionChange}
                placeholder="Counsellor"
                className="w-full mb-2 px-3 py-2 border rounded"
              />
              <input
                type="text"
                name="quizLink"
                value={formSession.quizLink}
                onChange={handleSessionChange}
                placeholder="Quiz Link"
                className="w-full mb-2 px-3 py-2 border rounded"
              />
              <input
                type="text"
                name="counselingLink"
                value={formSession.counselingLink}
                onChange={handleSessionChange}
                placeholder="Counselling Link"
                className="w-full mb-2 px-3 py-2 border rounded"
              />
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">
                {editSession ? "Update Session" : "Create Session"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batches;
