// @ts-nocheck
import { Button, Dropdown, Modal, Select, Pagination } from "flowbite-react";
import "./App.css";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import loader from "./assets/loading.gif";
import React from "react";
import axios from "axios";

function App() {
  const [sendLoading, setSendLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    number: "",
  });
  const [openModal, setOpenModal] = useState(false);
  const [openImage, setOpenImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [errorMessages, setErrorMessages] = useState({
    name: "",
    number: "",
  });

  // const baseURL = "http://localhost:3002/";
  const baseURL = "https://valid-backend-2cc8b31f2550.herokuapp.com/";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrorMessages({ ...errorMessages, [name]: "" }); // Clear error message when user starts typing
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(baseURL + "guests_list");
      paginate(1);
      setData(response.data.reverse() || []);
      setFilteredData(response.data.reverse() || []);
      console.log(response.data);
      console.log(response.data.reverse());
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Fehler beim Abrufen der Daten. Bitte versuchen Sie es später erneut.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setFilteredData([]);
    const filtered = data.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchQuery, data]);

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      const response = await axios.delete(`${baseURL}guests_list/${id}`);
      fetchData();
      setOpenModal(false); // Close the modal after deletion
      toast.success("Karte erfolgreich gelöscht!");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Fehler beim Löschen der Karte. Bitte versuchen Sie es später erneut.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {};

    // Validate each field
    if (!formData.name) {
      errors.name = "Name is required";
      isValid = false;
    }
    if (!formData.number) {
      errors.number = "Number of people is required";
      isValid = false;
    }

    setErrorMessages(errors);

    return isValid;
  };

  const addLineBreak = (text) => {
    // Check if the text contains the word "and"
    if (text.includes(" and ")) {
      // Replace " and " with " and\n" for line breaks
      text = text.replace(" and ", " and\n");
    }
    return text;
  };

  const submitForm = async () => {
    const isValid = validateForm();
    const payload = {
      name: addLineBreak(formData.name),
      twoNames: formData.name.includes(" and "),
      number: formData.number,
    };

    if (isValid) {
      try {
        setSendLoading(true);
        const response = await axios.post(baseURL + "fill-image", payload);
        const imageData = response.data;
        toast.success(
          `Die Einladungskarte für ${formData.name} wurde erfolgreich erstellt!`,
          { position: "top-right" }
        );
        fetchData();
        setFormData({
          name: "",
          number: "",
        });
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error("Etwas ist schief gelaufen. Bitte versuchen Sie es später erneut.");
      } finally {
        setSendLoading(false);
      }
    } else {
      toast.error("Bitte geben Sie einen Namen und eine Nummer ein!", { position: "top-right" });
    }
  };

  const shareImage = async (name, imagePath) => {
    try {
      // Use the correct base URL for fetching images
      const response = await axios.get(imagePath, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const file = new File([blob], `${name}.png`, { type: "image/png" });

      if (navigator.share) {
        await navigator.share({
          title: "Invitation Card",
          text: `Invitation card for ${name}`,
          files: [file],
        });
      } else {
        throw new Error("Web Share API not supported");
      }
    } catch (error) {
      console.error("Error sharing image:", error);
      toast.error("Fehler beim Teilen des Bildes. Bitte versuchen Sie es später erneut.");
    }
  };

  const downloadImage = async (name, imagePath) => {
    try {
      // Create a temporary anchor element to trigger the download
      const link = document.createElement("a");
      link.href = imagePath;
      link.setAttribute("download", `${name}.png`);
      link.setAttribute("target", "_blank");
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.remove();
      window.URL.revokeObjectURL(imagePath);

      // toast.success("Card downloaded successfully!", {
      //   position: "top-right",
      // });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Fehler beim Herunterladen des Bildes. Bitte versuchen Sie es später erneut.");
    }
  };

  const getTotal = () => {
    let total = 0;
    data.forEach((item) => {
      total += parseInt(item?.number);
    });
    return total;
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <>
      {loading ? (
        <div className="w-full h-[100vh] flex flex-col space-y-3 items-center justify-center">
          <img src={loader} alt="" />
          <span>Lädt...</span>
        </div>
      ) : (
        <div className="w-full h-full relative">
          <Toaster />
          <div className="w-[90%] md:w-[80%] mx-auto overflow-x-hidden">
            <div className="w-full flex flex-col items-center justify-center space-y-2 pt-10">
              <p className="text-lg font-semibold md:text-base">
              Die Gästeliste für Valid's Hochzeit
              </p>
            </div>
            <div className="w-full h-[2px] bg-[#1db67b] my-10"></div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 md:px-0">
              <div className="w-full">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Vorname, Nachname
                </label>
                <input
                  id="name"
                  type="text"
                  className={`input-field px-4 py-2 rounded-md w-full ${
                    errorMessages.name && "border-red-500"
                  }`}
                  name="name"
                  placeholder="Max Mustermann"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errorMessages.name && (
                  <p className="text-red-500 text-sm">{errorMessages.name}</p>
                )}
              </div>
              <div className="w-full">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Anzahl der Personen
                </label>
                <Select
                  id="number"
                  className={`input-field rounded-md w-full ${
                    errorMessages.number && "border-red-500"
                  }`}
                  name="number"
                  value={formData.number}
                  onChange={(e) => {
                    const { value } = e.target;
                    setFormData({ ...formData, number: value });
                    setErrorMessages({ ...errorMessages, number: "" }); // Clear error message when user selects a value
                  }}
                  placeholder="Select number of people"
                  style={{
                    backgroundColor: "#1db67b",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  <option value="" disabled hidden>
                  Anzahl der Personen auswählen
                  </option>
                  {[...Array(100)].map((_, index) => (
                    <option key={index} value={index + 1}>
                      {index + 1}
                    </option>
                  ))}
                </Select>
                {errorMessages.number && (
                  <p className="text-red-500 text-sm">{errorMessages.number}</p>
                )}
              </div>
            </form>

            <div className="flex items-center justify-center md:justify-end">
              <button
                className="bg-[#1db67b] text-white font-bold py-2 px-4 rounded my-10 mb-30 flex items-center space-x-2 disabled:opacity-70 select-none"
                disabled={sendLoading}
                onClick={submitForm}
              >
                <span>{sendLoading ? "Erstelle" : "Erstellen"}</span>

                {sendLoading ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-5 h-5 animate-spin"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between mb-2 w-[90%] mx-auto">
              <p className="text-xs font-bold tracking-wider text-gray-500 flex items-center justify-center space-x-2">
                <span>GESAMT</span>{" "}
                <span className="text-[#1db67b] text-base">
                  {filteredData?.length}
                </span>
              </p>
              <p className="text-xs font-bold tracking-wider text-gray-500 flex items-center justify-center space-x-2">
                <span>PERSONEN</span>{" "}
                <span className="text-[#1db67b] text-lg">{getTotal()}</span>
              </p>
            </div>

            <div className="w-full h-[2px] bg-[#1db67b] mb-5"></div>

            <input
              type="text"
              placeholder="Search by name"
              className="px-4 py-2 rounded-md w-full mb-5 placeholder-gray-500 border border-gray-200 focus:outline-none focus:border-[#1db67b]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="overflow-x-scroll">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400  mb-10">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Nr.
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3">
                    Anzahl der Personen
                    </th>
                    <th scope="col" className="px-6 py-3 text-center">
                    Karte
                    </th>
                    <th scope="col" className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, index) => (
                    <React.Fragment key={item?._id}>
                      <tr
                        key={item?._id}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          {indexOfFirstItem + index + 1}
                        </th>
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          {item?.name}
                        </th>
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          {item?.number}
                        </th>
                        <th
                          scope="row"
                          className="px-6 py-4 min-h-10 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-center justify-center text-[#7a7e60]"
                          // onClick={() => {
                          //   setSelectedImageId(item?._id);
                          //   setOpenImage(true);
                          // }}
                          onClick={() =>
                            downloadImage(item?.name, item?.imagePath)
                          }
                        >
                          {/* <img src={item?.imagePath} className="w-10" /> */}
                          {/* <p className="text-semibold mb-1 cursor-pointer">View Card</p> */}
                          <button className="bg-[#1db67b] text-white font-bold py-2 px-4 rounded flex items-center space-x-2 disabled:opacity-70 select-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="w-4 h-4 mr-3"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                              />
                            </svg>
                            <span>Karte anzeigen</span>
                          </button>
                        </th>
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white z-50"
                        >
                          <Dropdown
                            placement="right"
                            label=""
                            dismissOnClick={true}
                            renderTrigger={() => (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-6 h-6"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                                />
                              </svg>
                            )}
                          >
                            {/* <Dropdown.Item
                              onClick={() =>
                                shareImage(item?.name, item?.imagePath)
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-4 h-4 mr-3"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                                />
                              </svg>

                              <span>Share</span>
                            </Dropdown.Item> */}
                            {/* <Dropdown.Divider /> */}
                            {/* <Dropdown.Item
                              onClick={() =>
                                downloadImage(item?.name, item?.imagePath)
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-4 h-4 mr-3"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                                />
                              </svg>

                              <span>View Card</span>
                            </Dropdown.Item>
                            <Dropdown.Divider /> */}
                            <Dropdown.Item
                              onClick={() => {
                                setSelectedDeleteId(item?._id);
                                setOpenModal(true);
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-4 h-4 mr-3"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                              <span>Löschen</span>
                            </Dropdown.Item>
                          </Dropdown>
                          <Modal
                            show={openImage && selectedImageId === item?._id}
                            size="lg"
                            className="z-50"
                            onClose={() => setSelectedImageId(null)}
                            popup
                          >
                            <Modal.Header />
                            <Modal.Body>
                              <div className="text-center">
                                <img src={item?.imagePath} alt="" />
                              </div>
                            </Modal.Body>
                          </Modal>
                          <Modal
                            show={openModal && selectedDeleteId === item?._id}
                            size="md"
                            onClose={() => setSelectedDeleteId(null)}
                            popup
                          >
                            <Modal.Header />
                            <Modal.Body>
                              <div className="text-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="1.5"
                                  stroke="currentColor"
                                  className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                                  />
                                </svg>

                                <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                                Sind Sie sicher, dass Sie diese Daten löschen möchten?
                                </h3>
                                <div className="flex justify-center gap-4">
                                  <Button
                                    color="failure"
                                    disabled={deleteLoading}
                                    onClick={() => handleDelete(item?._id)}
                                  >
                                    <span>Ja, ich bin sicher</span>

                                    {deleteLoading ? (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                        className="w-5 h-5 animate-spin ml-2"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                                        />
                                      </svg>
                                    ) : (
                                      <></>
                                    )}
                                  </Button>
                                  <Button
                                    color="gray"
                                    onClick={() => setOpenModal(false)}
                                  >
                                   Nein, abbrechen
                                  </Button>
                                </div>
                              </div>
                            </Modal.Body>
                          </Modal>
                        </th>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

              {/* <nav className="mt-6 flex items-center justify-end mb-20">
                <ul className="pagination">
                  {filteredData.length > itemsPerPage &&
                    Array.from({ length: Math.ceil(filteredData.length / itemsPerPage) }).map((_, index) => (
                      <li key={index}>
                        <a
                          onClick={() => paginate(index + 1)}
                          href="#"
                          className={`${
                            currentPage === index + 1
                              ? "pagination__link--active"
                              : ""
                          }`}
                        >
                          {index + 1}
                        </a>
                      </li>
                    ))}
                </ul>
              </nav> */}
            </div>
            <div className="mt-5 mb-20 flex flex-col items-center space-y-3">
              <Pagination
                totalPages={Math.ceil(filteredData.length / itemsPerPage)}
                currentPage={currentPage}
                onPageChange={paginate}
                showIcons
                previousLabel=""
                nextLabel=""
                style={{
                  marginTop: "10px", // Add space from above
                  marginBottom: "10px", // Add space from below
                  fontSize: "12px", // Reduce font size for mobile view
                }}
                buttonprops={{
                  style: {
                    backgroundColor: "#1db67b", // Set background color
                    color: "#fff", // Set text color
                    padding: "4px 8px", // Adjust padding for smaller size
                    borderRadius: "4px", // Apply border radius for rounded corners
                    marginRight: "4px", // Add space between buttons
                    minWidth: "unset", // Remove minimum width for smaller size
                  },
                }}
              />
              <p className="text-sm text-gray-500">
              Anzeige {" "}
                <strong>
                  {Math.min(
                    (currentPage - 1) * itemsPerPage + 1,
                    filteredData.length
                  )}
                </strong>{" "}
                bis {" "}
                <strong>
                  {Math.min(currentPage * itemsPerPage, filteredData.length)}
                </strong>{" "}
                von <strong>{filteredData.length}</strong> Karten
              </p>
            </div>
          </div>
          <footer className="bg-[#1db67b] w-full text-white py-2 absolute bottom-0 left-0 right-0">
            <p className="text-center text-xs md:text-sm">
            Erstellt mit <span className="text-base mx-1">♥</span> von{" "}
              <a className="underline" href="https://www.evoluna.co">
                Evoluna
              </a>
            </p>
          </footer>
        </div>
      )}
    </>
  );
}

export default App;
