// I am going to start refactoring this thing.
// God damn is the structure soooo bad.

/*** IMPORTS *****/
import React, {useContext, useEffect, useState} from "react";
import {
    Button,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {Picker} from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import {openBrowserAsync} from "expo-web-browser";
import {AuthContext} from "../../AuthContext";
import DropDownPicker from 'react-native-dropdown-picker';

// ICON IMPORTS
import {AntDesign, Entypo, MaterialIcons} from '@expo/vector-icons';

//Conditional FileSaver import.
let FileSaver;
if (__DEV__ && Platform.OS === "web") {
    FileSaver = require("file-saver").default;
}
/*******************************************/

/* CONSTANTS FOR THE WHOLE PAGE */
const {width} = Dimensions.get("window");
const responsiveWidth = width * 0.8;
const BASE_URL = "http://192.168.50.157:3000"; // Change this according to Wifi.

function UploadScreen({navigation}) {
    const [selectedDocuments, setSelectedDocuments] = useState([]); // Documents to upload
    const [descriptions, setDescriptions] = useState(""); // Description text
    const [length, setLength] = useState(200); // Description text length
    const [prevDocuments, setPrevDocuments] = useState([]); // This is suppose to be the list of documents that you have uploaded previously.
    const [searchQuery, setSearchQuery] = useState(""); // This is for the search bar.
    const [selectedFolder, setSelectedFolder] = useState(); // Add state for selected folder
    const [folders, setFolders] = useState([]); // Add state for folders list
    const [folderSelection, setFoldersSelection] = useState({}); // Add state for folder selection -> map document to folder
    const [newFolderModalOpen, setNewFolderModalOpen] = useState(false); // Modal boolean for folder creation
    const [newFolderName, setNewFolderName] = useState(""); // New folder name
    const [transactions, setTransactions] = useState([]); // Add state for transactions list
    const [documentTransactions, setDocumentTransactions] = useState({}); // Document transactions
    const [defaultTransactionId, setDefaultTransactionId] = useState(1); // Default transaction id
    const [defaultFolderId, setDefaultFolderId] = useState(1); // Default folder id
    const [filteredDocs, setFilteredDocs] = useState(prevDocuments); // Filtered documents
    const {user} = useContext(AuthContext);
    const USER_ID = user.user.userId;
    const [isOpen1, setIsOpen1] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);

    // USE-EFFECT HOOKS //
    // Fetch the previous documents from the server.
    useEffect(() => {
        fetchDocuments();
    }, []);

    // Call fetchFolders on initial mount
    useEffect(() => {
        fetchFolders();
    }, []);

    // Fetch transactions on mount
    // Currently dummy user set to 1.
    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        const docs = prevDocuments.filter((doc) => {
            console.log("prevDocuments:", prevDocuments);
            console.log("selectedFolder:", selectedFolder);
            console.log("searchQuery:", searchQuery);
            const matchesFolder = selectedFolder
                ? doc.folderId.toString() === selectedFolder.toString()
                : true;
            const matchesSearch = doc.title
                .toLowerCase()
                .includes((searchQuery || "").toLowerCase());
            return matchesFolder && matchesSearch;
        });
        setFilteredDocs(docs);
    }, [searchQuery, selectedFolder]);

    // Weird hack so that useState works properly.
    useEffect(() => {
        console.log(transactions);
        setTransactions(transactions);
    }, [transactions]);

    useEffect(() => {
        console.log(prevDocuments);
        setPrevDocuments(prevDocuments);
    }, [prevDocuments]);

    useEffect(() => {
        console.log(folders);
        setFolders(folders);
    }, [folders]);

    useEffect(() => {
        console.log(filteredDocs);
        setFilteredDocs(filteredDocs);
    }, [filteredDocs]);
    // END OF USE-EFFECT HOOKS //

    // FETCH DATA FUNCTIONS
    const fetchDocuments = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}/user/documents/list/metadata/${USER_ID}}`
            );
            const documents = await response.json();
            setPrevDocuments(documents);
            setFilteredDocs(documents);
            setSelectedFolder(defaultFolderId);
            console.log(user);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchFolders = async () => {
        try {
            const response = await fetch(`${BASE_URL}/user/folders/${USER_ID}}`);
            const results = await response.json();
            const folders = results.folders;
            console.log(folders);
            setFolders(folders);
            setDefaultFolderId(folders[0].folderId);
            setSelectedFolder(folders[0].folderId);
            console.log(defaultFolderId);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await fetch(`${BASE_URL}/user/transactions/${USER_ID}`);
            const results = await response.json();
            const transactions = results.transactions;
            setTransactions(transactions);
            setDefaultTransactionId(transactions[0].transactionId);
            console.log(defaultTransactionId);
        } catch (error) {
            console.error(error);
        }
    };

    // END OF FETCH FUNCTIONS

    // START OF BUSINESS FUNCTIONS //
    const downloadPDF = async (document) => {
        // The web version is kinda not needed.
        if (Platform.OS === "web") {
            const response = await fetch(
                `${BASE_URL}/user/documents/${document.documentId}/data`
            );
            const result = await response.json();
            const doc = result.document;
            console.log(doc);
            const byteArray = new Uint8Array(result.document.data);
            const blob = new Blob([byteArray], {type: "application/pdf"});
            console.log(blob);
            const url = URL.createObjectURL(blob);
            await openBrowserAsync(url);
            FileSaver.saveAs(blob, document.name);
            URL.revokeObjectURL(url);
        } else {
            // Native FileSystem logic
            // Need to make sure it works.
            const {uri} = await FileSystem.writeAsStringAsync(
                FileSystem.documentDirectory + document.name,
                document.data,
                {encoding: FileSystem.EncodingType.Base64}
            );
            if (uri) {
                alert("Downloaded to " + uri);
            } else {
                alert("Failed to download PDF");
            }
        }
    };

    // Function to create new folder
    const createNewFolder = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}/user/folders/create/${USER_ID}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({folderTitle: newFolderName}),
                }
            );
            if (response.ok) {
                console.log("Folder created successfully");
            } else {
                console.log("Error creating folder");
            }
            setNewFolderModalOpen(false);
            await fetchFolders();
        } catch (error) {
            console.error(error);
        }
    };

    // This is supposed to show all the documents that you selected.
    const selectDocuments = async () => {
        try {
            const results = await DocumentPicker.getDocumentAsync({
                multiple: true,
                type: "application/pdf",
            });
            if (results.canceled === false) {
                const newSelectedDocuments = results.assets;
                setSelectedDocuments([...newSelectedDocuments]);
            }
        } catch (error) {
            console.log("Error selecting documents:", error);
        }
    };

    // This is supposed to remove a documents from the selected documents list.
    const removeDocument = (document) => {
        const newSelectedDocuments = selectedDocuments.filter(
            (doc) => doc.name !== document.name
        );
        setSelectedDocuments([...newSelectedDocuments]);
    };

    const removeDocumentFromServer = async (document) => {
        try {
            const url = `${BASE_URL}/user/documents/${document.documentId}`;
            const response = await fetch(url, {
                method: "DELETE",
            });
            if (response.ok) {
                console.log("Document deleted successfully");
                await fetchDocuments();
            } else {
                console.log("Error deleting document");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const downloadDocumentFromServer = (document) => {
        downloadPDF(document);
    };
    const getFolderTitle = (folderId) => {
        const foundFolder = folders.find((folder) => folder.folderId === folderId);
        return foundFolder ? foundFolder.title : "";
    };

    // This then uploads the documents you selected.
    const handleUpload = async () => {
        try {
            const fileData = new FormData();
            selectedDocuments.forEach((document) => {
                const fileuri = document.uri;
                const filetype = "application/pdf";
                const filename = document.name;
                const transactionId =
                    documentTransactions[document.name] !== undefined
                        ? documentTransactions[document.name]
                        : defaultTransactionId;
                const folderId =
                    folderSelection[document.name] !== undefined
                        ? folderSelection[document.name]
                        : defaultFolderId;
                console.log(documentTransactions);
                console.log(folderSelection);

                // Extract the base64-encoded data from the URI
                const base64Data = fileuri.split(",")[1];

                // Decode the base64 string into a Uint8Array
                const base64String = window.atob(base64Data);
                const bytes = new Uint8Array(base64String.length);
                for (let i = 0; i < base64String.length; i++) {
                    bytes[i] = base64String.charCodeAt(i);
                }

                // Create a Blob object from the decoded data
                const fileBlob = new Blob([bytes], {type: filetype});
                fileData.append("documents", fileBlob, filename);
                fileData.append("description", descriptions);
                fileData.append("transactionId", transactionId);
                fileData.append("folderId", folderId);
                fileData.append("userId", USER_ID);
            });

            // Send the data to the API
            const response = await fetch(`${BASE_URL}/user/documents/upload`, {
                method: "post",
                body: fileData,
            });

            // Check the response status and log the result
            if (response.ok) {
                const data = await response.json();
                console.log("Upload response:", data);
                await fetchDocuments();
            } else {
                console.log("File upload failed");
            }
        } catch (error) {
            console.log("Error upload:", error);
        }
    };

    // END OF FUNCTIONS, MOVING INTO RENDERED FUNCTION COMPONENTS. //

    // This is for the Select Documents
    const renderDocumentItem = ({item}) => (
        <View style={styles.documentItem}>
            <Text style={styles.documentText}>{item.name}</Text>
            <View>
                <Text style={styles.descriptionText}>Transaction ID: </Text>
                <DropDownPicker
                    open={isOpen1}
                    setOpen={setIsOpen1}
                    value={documentTransactions[item.name] || defaultTransactionId}
                    setValue={(callback) => {
                        const newValue = callback(documentTransactions[item.name]);
                        setDocumentTransactions(prev => ({ ...prev, [item.name]: newValue }));
                    }}
                    items={transactions.map(transaction => ({label: transaction.transactionId, value: transaction.transactionId}))}
                    defaultValue={documentTransactions[item.name]}
                    onChangeItem={(item) => setDocumentTransactions({...documentTransactions, [item.name]: item.value})}
                    containerStyle={{height: 40}} // Adjust as needed
                    style={{backgroundColor: '#fafafa'}} // Adjust as needed
                    dropDownStyle={{backgroundColor: '#fafafa'}} // Adjust as needed
                />

                <Text style={styles.descriptionText}>Folder for Document: </Text>

                <DropDownPicker
                    open={isOpen2}
                    setOpen={setIsOpen2}
                    value={folderSelection[item.name] || defaultFolderId}
                    setValue={(callback) => {
                        const newValue = callback(folderSelection[item.name]);
                        setFoldersSelection(prev => ({ ...prev, [item.name]: newValue }));
                    }}
                    items={folders.map(folder => ({label: folder.title, value: folder.folderId}))}
                    defaultValue={folderSelection[item.name]}
                    onChangeItem={(item) => setFoldersSelection({...folderSelection, [item.name]: item.value})}
                    containerStyle={{height: 40}} // Adjust as needed
                    style={{backgroundColor: '#fafafa'}} // Adjust as needed
                    dropDownStyle={{backgroundColor: '#fafafa'}} // Adjust as needed
                />
                <TouchableOpacity style={styles.downloadButton} onPress={() => removeDocument(item)}>
                    <Text style={styles.downloadButtonText}>Remove</Text>
                </TouchableOpacity>
                <Text>&nbsp;</Text>
            </View>
        </View>
    );

    // This is for the Previously Uploaded Documents
    const renderDocumentListItem = ({item}) => (
        <View style={styles.documentItem}>
            <Text style={styles.documentText}>{item.title}</Text>
            <Text>&nbsp; &nbsp;</Text>
            <View>
                <Text style={styles.descriptionText}>Description: </Text>
                <Text style={styles.documentText}>{item.description}</Text>
            </View>
            <View>
                <Text style={styles.descriptionText}>Transaction ID: </Text>
                <Text style={styles.documentText}>{item.transactionId}</Text>
                <Text style={styles.descriptionText}>Folder: </Text>
                <Text style={styles.documentText}>{getFolderTitle(item.folderId)}</Text>
            </View>
            <View>
                <Button
                    style={styles.downloadButton}
                    title="Remove"
                    onPress={() => removeDocumentFromServer(item)}
                />
                <Text>&nbsp;</Text>
                <TouchableOpacity
                    onPress={() => downloadDocumentFromServer(item)}
                >
                    <Entypo name="download" size={24} color="black"/>
                </TouchableOpacity>
            </View>
        </View>
    );

    // BEGIN OF ACTUAL HTML RENDERING //
    return (
        <SafeAreaView style={styles.container}>
            {/* Wrap the FlatList in a View with border styles */}
            <View style={styles.documentListContainer}>
                <FlatList
                    ListHeaderComponent={
                        <>
                            <Text style={styles.detailText}>List of Selected Documents:</Text>
                        </>
                    }
                    ListFooterComponent={
                        <>
                            <View style={styles.descriptionContainer}>
                                <Text style={styles.detailText}>
                                    Write your description for the files selected:
                                </Text>
                                <TextInput
                                    style={styles.descriptionInput}
                                    placeholder="Add a description"
                                    value={descriptions}
                                    maxLength={200} // max length of the text
                                    onChangeText={(text) => {
                                        setDescriptions(text);
                                        setLength(200 - text.length);
                                    }}
                                />
                                <Text> Remaining: {length}</Text>
                            </View>
                            <View style={styles.iconContainer}>
                                <TouchableOpacity onPress={selectDocuments}>
                                    <AntDesign name="addfile" size={24} color="black"/>
                                </TouchableOpacity>
                                <Text> &nbsp;&nbsp;&nbsp; </Text>
                                <TouchableOpacity onPress={handleUpload}>
                                    <AntDesign name="clouduploado" size={24} color="black"/>
                                </TouchableOpacity>
                            </View>
                        </>
                    }
                    ListEmptyComponent={() => (
                        <View style={styles.emptyListContainer}>
                            <MaterialIcons name="description" size={40} color="lightgray"/>
                            <Text style={styles.emptyListText}>
                                Your selected documents would appear here.
                            </Text>
                        </View>
                    )}
                    data={selectedDocuments}
                    keyExtractor={(item, index) =>
                        item.id ? item.id.toString() : index.toString()
                    }
                    renderItem={renderDocumentItem}
                />
            </View>
            <View style={styles.documentListContainer}>
                <FlatList
                    ListHeaderComponent={
                        <>
                            <Text style={styles.detailText}>Previously Uploaded Documents: </Text>
                            <View style={styles.documentListContainer}>
                                <TextInput
                                    style={styles.searchBar}
                                    placeholder="Search documents..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                <Text> Select your Folder Below: </Text>
                                <Picker
                                    selectedValue={selectedFolder}
                                    onValueChange={setSelectedFolder}
                                >
                                    {folders.map((folder) => (
                                        <Picker.Item
                                            label={folder.title}
                                            value={folder.folderId}
                                            key={folder.folderId}
                                        />
                                    ))}
                                </Picker>
                                <Text>&nbsp;</Text>
                                <View style={styles.iconContainer}>
                                    <TouchableOpacity
                                        onPress={() => setNewFolderModalOpen(true)}
                                    >
                                        <AntDesign name="addfolder" size={24} color="black"/>
                                    </TouchableOpacity>
                                </View>
                                {newFolderModalOpen && (
                                    <Modal
                                        animationType="slide"
                                        transparent={true}
                                        visible={newFolderModalOpen}
                                    >
                                        <View style={styles.centeredView}>
                                            <View style={styles.modalView}>
                                                <Text style={styles.descriptionText}> Folder Creation Section: </Text>
                                                <TextInput
                                                    placeholder="New folder name"
                                                    value={newFolderName}
                                                    onChangeText={setNewFolderName}
                                                    style={styles.modalTextInput}
                                                    placeholderTextColor="#888"
                                                />
                                                <TouchableOpacity style={styles.button} onPress={createNewFolder}>
                                                    <Text style={styles.buttonText}>Create Folder</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.cancelButton}
                                                                  onPress={() => setNewFolderModalOpen(false)}>
                                                    <Text style={styles.buttonText}>Cancel</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </Modal>
                                )}
                            </View>
                        </>
                    }
                    data={filteredDocs}
                    renderItem={renderDocumentListItem}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyListContainer}>
                            <MaterialIcons name="description" size={40} color="lightgray"/>
                            <Text style={styles.emptyListText}>
                                Your previous documents would appear here.
                            </Text>
                        </View>
                    )}
                    keyExtractor={(item, index) =>
                        item.id ? item.id.toString() : index.toString()
                    }
                    ListFooterComponent={
                        <>
                            <Text style={styles.graytext}>
                                Welcome, {user.user.name}, you are the #{USER_ID} user!
                            </Text>
                        </>
                    }
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: '10%',
        backgroundColor: "#fff",
        flex: 1,
        paddingHorizontal: 10,
    },

    headerText: {
        fontSize: 10,
        marginBottom: "2%",
        textAlign: "center",
    },

    searchBar: {
        height: '10%', // 'auto' is not a valid value for height in React Native
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        paddingHorizontal: 2,
        marginVertical: 2,
    },

    iconContainer: {
        alignItems: 'flex-start',
        justifyContent: 'space-evenly',
        flexDirection: "row",
        borderColor: '#000',
        borderWidth: 1,
        borderRadius: 15,
        padding: 5,
    },

    descriptionContainer: {
        marginVertical: '4%',
    },

    descriptionInput: {
        height: 30, // Changed from `1%` to a fixed value
        borderColor: "gray",
        borderWidth: 1,
        borderRadius: 5, // Changed from `2%` to a fixed value
        marginVertical: `2%`,
        padding: `2%`,
    },

    downloadButton: {
        backgroundColor: "#ffffff", // White background
        borderColor: "#007AFF", // Blue border
        borderWidth: 1, // Border width
        paddingVertical: 10, // Vertical padding
        paddingHorizontal: 20, // Horizontal padding
        borderRadius: 12, // Rounded corners
        alignItems: 'center', // Center text horizontally
        justifyContent: 'center', // Center text vertically
        shadowColor: "#000", // Shadow color
        shadowOffset: {
            width: 0,
            height: 2, // Shadow position
        },
        shadowOpacity: 0.1, // Shadow opacity
        shadowRadius: 4, // Shadow blurring
    },

    downloadButtonText: {
        color: "#007AFF", // Blue text
        fontWeight: "600", // Semi-bold text
        fontSize: 16, // Font size
    },


    detailText: {
        fontSize: 12,
        marginBottom: "2%",
        fontWeight: "bold",
    },

    documentListContainer: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 5, // Changed from `2%` to a fixed value
        padding: "3%",
        paddingTop: "3.5%",
        flex: 1,
    },

    documentItem: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.5%", // Reduced padding for a more compact look
        marginBottom: "1%", // Reduced margin for a more compact look
        backgroundColor: "#FFFFFF", // Lighter background color for iOS theme
        borderRadius: 10, // Moderate border radius for a card-like appearance
        width: "100%",
        shadowColor: "#000", // Shadow for a card-like appearance
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },

    documentText: {
        fontSize: 16, // A size that is readable and maintains hierarchy
        fontWeight: '500', // Semi-bold to make the text stand out
        color: '#333', // A shade of black to keep text readable and clean
        paddingVertical: 10, // Some vertical padding to give space around the text
        paddingHorizontal: 16, //
    },

    descriptionText: {
        fontSize: 14, // Changed from `3.5%` to a fixed value
        fontStyle: "italic",
        fontWeight: "bold",
    },

    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
    },

    modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 35,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },

    modalTextInput: {
        width: '100%',
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10, // Text input padding
        marginBottom: 20, // Margin at the bottom of the input
    },

    button: {
        backgroundColor: '#1a73e8', // A pleasant blue tone for the primary button
        padding: 10,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
        marginVertical: 5, // A little vertical margin for aesthetic spacing
    },
    cancelButton: {
        backgroundColor: '#ccc', // A neutral gray for the cancel button
        padding: 10,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
        marginVertical: 5, // A little vertical margin for aesthetic spacing
    },
    buttonText: {
        color: 'white',
        fontWeight: '600', // Semi-bold text
    },

    picker: {
        fontSize: 12,
        paddingVertical: "3%",
        paddingHorizontal: "2.5%",
        borderWidth: 1,
        borderColor: "gray",
        borderRadius: 5, // Changed from `1%` to a fixed value
        backgroundColor: "white",
        color: "black",
    },

    graytext: {
        fontSize: 12, // Changed from `2%` to a fixed value
        color: "#808080",
    },

    emptyListContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emptyListText: {
        fontSize: 18,
        color: 'gray',
        textAlign: 'center',
        marginTop: 10,
    }, undefined

});

export default UploadScreen;
