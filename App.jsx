import React from "react"
import Sidebar from "./components/Sidebar.jsx"
import Editor from "./components/Editor.jsx"
import Split from "react-split"
import { nanoid } from "nanoid"
import { onSnapshot, addDoc, doc, deleteDoc, setDoc } from "firebase/firestore"
import { notesCollection, db } from "./firebase.js"

export default function App() {
    const [notes, setNotes] = React.useState([]);   // this callback function while initialising state, only renders the initial value once i.e. when the component first runs.

    const [currentNoteId, setCurrentNoteId] = React.useState("");
    
    const [tempNoteText, setTempNoteText] = React.useState("");

    const currentNote = 
        notes.find(note => note.id === currentNoteId) 
        || notes[0]

    React.useEffect(() => {
        if(currentNote)
        {
            setTempNoteText(currentNote.body);
        }
    }, [currentNote]);

    React.useEffect(() => {   // debouncing logic
        const timeoutId = setTimeout(() => {
            if (tempNoteText !== currentNote.body) {   // this condition is to prevent the re-ordering of the sidebar notes on just selecting a note (or changing the 'currentNote').
                updateNote(tempNoteText)
            }
        }, 500)
        return () => clearTimeout(timeoutId)
    }, [tempNoteText])

    React.useEffect(() => {
        const unsubscribe = onSnapshot(notesCollection, function(snapshot){   // the onSnapshot function is an event listener that listens outs for changes in an entity. It takes in 2 parameters, first is the entity on which we want to listen out for changes to (through the onSnapshot event listener).
            const notesArr = snapshot.docs.map((doc) => {   //the second parameter of the onSnapshot function is a function that is invoked whenever onSnapshot detects a change on the entity it is looking out for.
                return {   // in our case, we are looking out for the data in the database to change and whenever a change is detected by onSnapshot, it invokes the callback function to update our local state array of 'notes'
                    ...doc.data(),   // the onSnapshot method returns a function which can be used to cut the connection between onSnapshot and the entity it is spying on for changes. This can be particularly useful whenever the user closes off our notes app for example, it thus helps in memory leaks. Hence, 'unsubscribe' is used as a cleanup function of the useEffect hook.
                    id: doc.id
                }
            });
            setNotes(notesArr);
        });
        return unsubscribe;
    }, []);

    React.useEffect(() => {
        if(!currentNoteId)
        {
            setCurrentNoteId(notes[0]?.id)
        }
    }, [notes]);

    async function createNewNote() {
        const newNote = {
            body: "# Type your markdown note's title here",
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        const newNoteRef = await addDoc(notesCollection, newNote);
        setCurrentNoteId(newNoteRef.id);
    }

    async function updateNote(text) {
        const docRef = doc(db, "notes", currentNoteId);
        await setDoc(docRef, { body: text, updatedAt: Date.now() }, { merge: true });
    }

    async function deleteNote(event, noteId) {
        event.stopPropagation() // event.stopPropagation() stops the event from spreading to its parent elements i.e. the event will only occur on the element that is intended to handle the event without passing on the event in a chain to other parent elements as well   
        const docRef = doc(db, "notes", noteId);
        await deleteDoc(docRef);
    }

    const sortedNotesArray = notes.sort((a, b) => {
        if(a.updatedAt > b.updatedAt)
        {
            return -1;
        }
        else if(a.updated < b.updated)
        {
            return 1;
        }
        return 0;
    });

    return (
        <main>
            {
                notes.length > 0
                    ?
                    <Split
                        sizes={[30, 70]}
                        direction="horizontal"
                        className="split"
                    >
                        <Sidebar
                            notes={sortedNotesArray}
                            currentNote={currentNote}
                            setCurrentNoteId={setCurrentNoteId}
                            newNote={createNewNote}
                            deleteNote={deleteNote}
                        />
                        <Editor
                            tempNoteText={tempNoteText}
                            setTempNoteText={setTempNoteText}
                        />
                    </Split>
                    :
                    <div className="no-notes">
                        <h1>You have no notes</h1>
                        <button
                            className="first-note"
                            onClick={createNewNote}
                        >
                            Create one now
                </button>
                    </div>

            }
        </main>
    )
}
