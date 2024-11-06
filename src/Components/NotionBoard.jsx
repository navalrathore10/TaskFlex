import React, { useEffect, useState } from 'react'
import { FaFire } from 'react-icons/fa';
import { FiTrash, FiPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function NotionBoard() {
    return (
        <div className='h-min min-h-screen w-full bg-neutral-900 text-neutral-50 border-white'
            style={{overscrollBehavior: 'none'}} >
            <div className="Infoboard w-[500px] h-[100px] text-5xl flex justify-center items-center border border-red-500">
                TaskFlex
            </div>
            <Board />
        </div>
    )
};


const Board = () => {
    const [cards, setCards] = useState([]);
    const [hasChecked, setHasChecked] = useState(false);
    const [isDragging, setIsDragging] = useState(false); // Add state to track dragging

    useEffect(() => {
        hasChecked && localStorage.setItem('cards', JSON.stringify(cards));
    }, [cards]);

    useEffect(() => {
        const cardData = localStorage.getItem('cards');
        setCards(cardData ? JSON.parse(cardData) : []);
        setHasChecked(true);
    }, []);

    return (
        <div className='grid grid-cols-5 gap-3 p-5 lg:p-12'>
            <div className="grid grid-cols-4 col-span-5 md:col-span-4 gap-3 border-white">
                <Column
                    title='Backlog'
                    column='backlog'
                    headingColor='text-red-800'
                    cards={cards}
                    setCards={setCards}
                    setIsDragging={setIsDragging} // Pass the drag handler
                />
                <Column
                    title='TODO'
                    column='todo'
                    headingColor='text-yellow-300'
                    cards={cards}
                    setCards={setCards}
                    setIsDragging={setIsDragging} // Pass the drag handler
                />
                <Column
                    title='In Progress'
                    column='doing'
                    headingColor='text-blue-300'
                    cards={cards}
                    setCards={setCards}
                    setIsDragging={setIsDragging} // Pass the drag handler
                />
                <Column
                    title='Complete'
                    column='done'
                    headingColor='text-emerald-300'
                    cards={cards}
                    setCards={setCards}
                    setIsDragging={setIsDragging} // Pass the drag handler
                />
            </div>
            <BurnBarrel setCards={setCards} isDragging={isDragging} /> {/* Pass isDragging */}
        </div>
    );
};

const Column = ({ title, headingColor, column, cards, setCards, setIsDragging }) => {

    const [active, setActive] = useState(false);

    const handleDragStart = (e, card) => {
        e.dataTransfer.setData('cardId', card.id);
        setActive(true);
        setIsDragging(true); // Set dragging to true
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        highlightIndicator(e);
        setActive(true);
    };

    const highlightIndicator = (e) => {
        const indicators = getIndicators();
        clearHighlights(indicators);
        const el = getNearestIndicator(e, indicators);
        if (el) {
            el.element.style.opacity = "1";
        }
        else {
            console.log("No indicator found");
        }
    };


    const getIndicators = () => {
        return Array.from(document.querySelectorAll(`[data-column="${column}"]`));
    };

    const clearHighlights = (els) => {
        const indicators = els || getIndicators();

        indicators.forEach((i) => {
            i.style.opacity = '0';
        })
    };

    const getNearestIndicator = (e, indicators) => {
        const DISTANCE_OFFSET = 50;

        const el = indicators.reduce(
            (closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = e.clientY - (box.top + DISTANCE_OFFSET);

                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            },
            {
                offset: Number.NEGATIVE_INFINITY,
                Element: indicators[indicators.length - 1],
            }
        );

        return el;
    };

    const handleDragLeave = (e) => {
        setActive(false);
        clearHighlights();
    };
    const handleDragEnd = (e) => {
        setActive(false);
        setIsDragging(false);
        clearHighlights();

        const cardId = e.dataTransfer.getData('cardId');

        const indicators = getIndicators();
        const { element } = getNearestIndicator(e, indicators);

        const before = element.dataset.before || '-1';

        if (before !== cardId) {
            let copy = [...cards];

            let cardToTransfer = copy.find((c) => c.id === cardId);

            if (!cardToTransfer) return;

            cardToTransfer = { ...cardToTransfer, column };

            copy = copy.filter((c) => c.id !== cardId);

            const moveToBack = before === '-1';

            if (moveToBack) {
                copy.push(cardToTransfer)
            } else {
                const insertAtIndex = copy.findIndex((el) => el.id === before);
                if (insertAtIndex === undefined) return;

                copy.splice(insertAtIndex, 0, cardToTransfer);
            }

            setCards(copy);
        }
    };

    const filteredCards = cards.filter((c) => c.column === column);
    // console.log(filteredCards);

    return <>
        <div className=' col-span-4 sm:col-span-2 lg:col-span-1 min-w-[`180px] shrink-0'>
            <motion.div layout className='mb-3 flex items-center justify-between'>
                <h3 className={`font-medium ${headingColor}`}>
                    {title}
                </h3>
                <span className='rounded text-sm text-neutral-400'>
                    {filteredCards.length}
                </span>
            </motion.div>
            <motion.div layout
                onDrop={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`h-min w-full transition-colors ${active ? 'bg-neutral-800/50' : 'bg-neutral-800/0'}`}>
                {filteredCards.map((c) => {
                    return (
                        <Card
                            key={c.id}
                            {...c}
                            handleDragStart={handleDragStart}
                            setCards={setCards}
                            cards={cards}
                        />
                    );
                })}
                <DropIndicator beforId='-1' column={column} />

                <AddCard column={column} setCards={setCards} />
            </motion.div>
        </div>
    </>
};

const Card = ({ title, column, id, handleDragStart, setCards, cards }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(title);

    // Function to handle when editing is done (Enter key or blur)
    const handleEditComplete = () => {
        if (!editText.trim()) return;

        const updatedCards = cards.map((card) =>
            card.id === id ? { ...card, title: editText } : card
        );
        setCards(updatedCards);
        setIsEditing(false);
    };

    // Function to handle keypress (Enter key to save)
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleEditComplete();
        }
    };

    return (
        <>
            <DropIndicator beforId={id} column={column} />
            <motion.div
                layout
                layoutId={id}
                draggable='true'
                onDragStart={(e) => handleDragStart(e, { title, id, column })}
                onDoubleClick={() => setIsEditing(true)} // Double-click to enter edit mode
                className='cursor-grab rounded border border-neutral-700 bg-neutral-800 p-3 py-2 lg:py-3 active:cursor-grabbing '>

                {/* Show input for editing if in editing mode */}
                {isEditing ? (
                    <input
                        type='text'
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onBlur={handleEditComplete}
                        autoFocus
                        className='w-full bg-neutral-700 text-neutral-50 p-1 rounded outline-none'
                    />
                ) : (
                    <p className='text-sm text-neutral-100'>
                        {title}
                    </p>
                )}
            </motion.div>
        </>
    );
};

const DropIndicator = ({ beforId, column }) => {
    return (
        <>
            <div
                data-before={beforId || '-1'}
                data-column={column}
                className='my-0.5 h-0.5 w-full bg-violet-400 opacity-0'>

            </div>
        </>
    )
}

const BurnBarrel = ({ setCards, isDragging }) => {
    const [active, setActive] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setActive(true);
    };

    const handleDragLeave = (e) => {
        setActive(false);
    };

    const handleDrop = (e) => {
        const cardId = e.dataTransfer.getData('cardId');
        setCards((prevCards) => prevCards.filter((c) => c.id !== cardId));
        setActive(false);
    };

    return (
        <motion.div
            layout
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`absolute bottom-5 left-1/2 transform -translate-x-1/2 h-[70px] w-[70px] rounded-xl  
                md:relative md:bottom-0 md:-translate-x-0 md:left-0 mt-10 grid md:h-48 md:w-full shrink-0 place-content-center rounded border text-3xl
                transition-opacity duration-300
                ${active ? 'border-red-800 bg-red-800/20 text-red-500' : 'border-neutral-500 bg-neutral-500/20 text-neutral-500'}
                ${isDragging ? 'opacity-100' : 'opacity-0'} md:opacity-100`}> {/* Show only when dragging */}
            {active ? <FaFire className='animate-bounce' /> : <FiTrash />}
        </motion.div>
    );
};


const AddCard = ({ column, setCards }) => {
    const [text, setText] = useState('');
    const [adding, setAdding] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!text.trim().length) return;

        const newCard = {
            column,
            title: text.trim(),
            id: Math.random().toString(),
        };

        setCards((pv) => [...pv, newCard]);

        setAdding(false);
    };

    return <>
        {adding
            ? <motion.form layout onSubmit={handleSubmit}>
                <textarea
                    onChange={(e) => setText(e.target.value)}
                    autoFocus
                    placeholder='Add new task...'
                    className='w-full rounded border border-biolet-400 bg-violet-400/20 p-3
                    text-sm text-neutral-50 placeholder-violet-300 focus:outline-0'
                    name=""
                    id=""
                />

                <div className='mt-1.5 flex items-center justify-end gap-1.5'>
                    <button
                        onClick={() => setAdding(false)}
                        className='px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50'>
                        Close
                    </button>
                    <button
                        type='submit'
                        className='flex items-center gap-1.5 rounded px-3 py-1.5 text-xs bg-neutral-50 text-neutral-950 transition-colors hover:bg-neutral-300'>
                        <span>Add</span>
                        <FiPlus />
                    </button>
                </div>
            </motion.form>
            : <motion.button
                layout
                onClick={() => setAdding(true)}
                className='flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50'>
                <span>Add Card</span>
                <FiPlus />
            </motion.button>}
    </>
}

const DEFAULT_CARDS = [
    // Backlog
    {
        title: 'Complete one Full Stack Project',
        id: '1',
        column: 'backlog'
    },
    {
        title: 'Get a Job',
        id: '2',
        column: 'backlog'
    },
    {
        title: 'Make Parents Proud',
        id: '3',
        column: 'backlog'
    },
    {
        title: 'Learn Redux',
        id: '9',
        column: 'backlog'
    },
    {
        title: 'Master TypeScript',
        id: '10',
        column: 'backlog'
    },

    // TODO
    {
        title: 'Apply to Jobs Daily',
        id: '4',
        column: 'todo'
    },
    {
        title: 'Improve Portfolio Website',
        id: '5',
        column: 'todo'
    },
    {
        title: 'Contribute to Open Source',
        id: '6',
        column: 'todo'
    },
    {
        title: 'Read 2 Books on JavaScript',
        id: '11',
        column: 'todo'
    },

    // Doing
    {
        title: 'Working on Portfolio Updates',
        id: '7',
        column: 'doing'
    },
    {
        title: 'Preparing for Interviews',
        id: '8',
        column: 'doing'
    },
    {
        title: 'Building Side Projects',
        id: '12',
        column: 'doing'
    },

    // Complete
    {
        title: 'Completed HTML/CSS/JS Courses',
        id: '13',
        column: 'complete'
    },
    {
        title: 'Built a Responsive Webpage',
        id: '14',
        column: 'complete'
    },
    {
        title: 'Learned React Basics',
        id: '15',
        column: 'complete'
    }
];
