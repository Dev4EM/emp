import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPrograms,
  createPrograms,
  updatePrograms,
  deleteProgram,
} from "../components/Api";
import { toast } from "react-toastify";
import { MdCreateNewFolder } from "react-icons/md";
import { FaEdit, FaTrash } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import useUser from "../hooks/useUser";

const Workshop = () => {
  const [programs, setPrograms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const navigate = useNavigate();

  const { user } = useUser();
   const userEmail = user ? user['Work email']:'' ;
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    days: [], // ✅ Store selected days as array
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // ✅ Allowed user emails that can edit or delete
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
 

 

  // ✅ Fetch all programs
  const fetchPrograms = async () => {
    try {
      const res = await getPrograms();
      setPrograms(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  // ✅ Handle text input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle day selection
  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const updatedDays = prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day];
      return { ...prev, days: updatedDays };
    });
  };

  // ✅ Handle new program creation
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        duration: formData.days.join(", "), // store as comma-separated string
      };
      await createPrograms(dataToSend);
      fetchPrograms();
      setFormData({ name: "", description: "", days: [] });
      setShowCreateModal(false);
      toast.success("Workshop created successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error creating workshop");
    }
  };

  // ✅ Handle program update
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        duration: formData.days.join(", "),
      };
      await updatePrograms(selectedProgram._id, dataToSend);
      fetchPrograms();
      setShowEditModal(false);
      toast.success("Workshop updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error updating workshop");
    }
  };

  // ✅ Handle program delete
  const handleDelete = async (program) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the workshop "${program.name}"?`
    );
    if (!confirmDelete) return;

    try {
      await deleteProgram(program._id);
      fetchPrograms();
      toast.success("Workshop deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting workshop");
    }
  };

  // ✅ Handle card click (navigate)
  const handleCardClick = (programId) => {
    navigate(`/batches/${programId}`);
  };

  // ✅ Open edit modal
  const openEditModal = (program) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      description: program.description || "",
      days: program.duration
        ? program.duration.split(",").map((d) => d.trim())
        : [],
    });
    setShowEditModal(true);
  };

  return (
    <div className="container mx-auto mt-8 px-4 bg-white min-h-screen p-2">
      <div className="flex flex-row justify-between max-w-[1300px] mt-5 items-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Workshops</h2>

      {allowedEditors.includes(userEmail) && (   <button
          onClick={() => setShowCreateModal(true)}
          className="mb-6 px-4 py-2 bg-blue-600 flex flex-row items-center text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          <MdCreateNewFolder />
          <span className="hidden md:block ml-2">Create New Workshop</span>
        </button>)}
      </div>

      {/* ========================== CREATE MODAL ========================== */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <h3 className="text-xl font-bold mb-4">Create New Workshop</h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold"
            >
              ✕
            </button>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block font-medium mb-1">Workshop Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ✅ Days of the week checkboxes */}
              <div className="mb-4">
                <label className="block font-medium mb-2">
                  Select Workshop Start Days
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map((day) => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.days.includes(day)}
                        onChange={() => handleDayToggle(day)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Create Workshop
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================== EDIT MODAL ========================== */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <h3 className="text-xl font-bold mb-4">Edit Workshop</h3>
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold"
            >
              ✕
            </button>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block font-medium mb-1">Workshop Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ✅ Days selection in Edit Modal */}
              <div className="mb-4">
                <label className="block font-medium mb-2">
                  Select Workshop Days
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map((day) => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.days.includes(day)}
                        onChange={() => handleDayToggle(day)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Update Workshop
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================== PROGRAM CARDS ========================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {programs?.map((program) => (
          <div
            key={program._id}
            className="relative bg-white p-5 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-200"
          >
            <div
              onClick={() => handleCardClick(program._id)}
              className="cursor-pointer"
            >
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                {program.name}
              </h3>
              <p className="text-gray-600 text-sm">{program.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                Days: {program.duration}
              </p>
            </div>

            {/* ✅ Show edit/delete only if user email is allowed */}
            {allowedEditors.includes(userEmail) && (
              <div className="absolute top-3 right-3 flex gap-3">
                <FaEdit
                  onClick={() => openEditModal(program)}
                  className="text-blue-600 cursor-pointer hover:text-blue-800"
                  title="Edit"
                />
                <FaTrash
                  onClick={() => handleDelete(program)}
                  className="text-red-600 cursor-pointer hover:text-red-800"
                  title="Delete"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Workshop;
