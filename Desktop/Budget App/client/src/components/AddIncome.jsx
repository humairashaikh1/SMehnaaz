import React, { useState, useEffect } from "react";
import { TextField, Button, InputLabel, Select, MenuItem, Grid, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Container, AppBar, Toolbar, Box } from "@mui/material";
import { useQuery, gql } from "@apollo/client";
import { useMutation } from "@apollo/client";
import { Table, TableHead, TableBody, TableRow, TableCell, Paper } from "@mui/material";


const GET_TRANSACTIONS = gql`
  query {
    transactions {
      transID
      transAmt
      transDesc
      transtype
      categories
    }
  }
`;

const ADD_TRANSACTION = gql`
  mutation AddTransaction($transAmt: Float!, $transDesc: String!, $transtype: transtype) {
    addTransaction(transAmt: $transAmt, transDesc: $transDesc, transtype: $transtype) {
      transID
      transAmt
      transDesc
      transtype
    }
  }
`;

const DELETE_TRANSACTION = gql`
  mutation DeleteTransaction($transID: ID!) {
    deleteTransaction(transID: $transID) {
      transAmt
      transDesc
    }
  }
`;

const UPDATE_TRANSACTION_AMOUNT = gql`
  mutation UpdateTransactionAmount($transID: ID!, $newTransAmt: Int!, $newTransDesc: String) {
    updateTransactionAmount(transID: $transID, newTransAmt: $newTransAmt, newTransDesc: $newTransDesc) {
      transID
      transAmt
      transDesc
    }
  }
`;

const containerStyle = {
    position: "relative",
};

/*const backgroundStyle = {
    content: "",
    backgroundImage:
        'url("https://media.istockphoto.com/id/840729734/vector/blue-light-polygonal-low-polygon-triangle-pattern-background.jpg?s=612x612&w=0&k=20&c=XxkzZsuQ-kG0wMc-FJ4EPoQ2UAhQLnrp_1E-i0U80yg=")',
    opacity: 0.9, // Adjust the opacity for the watermark effect
    backgroundSize: "cover",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
};
*/
const AddIncome = () => {
    const [addTransactionMutation] = useMutation(ADD_TRANSACTION);
    const [updateTransactionAmountMutation] = useMutation(UPDATE_TRANSACTION_AMOUNT);
    const [deleteTransactionMutation] = useMutation(DELETE_TRANSACTION);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [newTransactionAmount, setNewTransactionAmount] = useState("");
    const [transactionToUpdate, setTransactionToUpdate] = useState(null);
    const [newTransaction, setNewTransaction] = useState({ description: '', amount: '' });
    const [errorMessage, setErrorMessage] = useState("");
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);

    const { error, data, loading, refetch } = useQuery(GET_TRANSACTIONS);

    useEffect(() => {
        if (!loading && !error) {
            const transactions = data.transactions;
            let income = 0;
            let expense = 0;

            transactions.forEach((transaction) => {
                if (transaction.transtype === "Income") {
                    income += transaction.transAmt;
                } else if (transaction.transtype === "Expense") {
                    expense += transaction.transAmt;
                }
            });

            setTotalIncome(income);
            setTotalExpense(expense);
        }
    }, [data, loading, error]);

    const balance = totalIncome - totalExpense;
    const formattedBalance = balance.toLocaleString();

    const handleAmountChange = (e) => {
        const numericValue = e.target.value.replace(/[^0-9]/g, "");
        setNewTransaction({ ...newTransaction, amount: numericValue });

        if (e.target.value !== numericValue) {
            setErrorMessage("Please enter digits only.");
        } else {
            setErrorMessage("");
        }
    };

    const [transactionType, setTransactionType] = useState('Expense');
    const [expenseCategory, setexpenseCategory] = useState('');
    const [textWarning, setTextWarning] = useState('');

    console.log({ error, data, loading });
    if (loading) return <div>LOADING...</div>
    if (error) return <div>Something went wrong</div>

    const handleAddTransaction = () => {
        if (newTransaction.amount !== '' && newTransaction.description !== '') {

            addTransactionMutation({
                variables: {
                    transAmt: parseFloat(newTransaction.amount),
                    transDesc: newTransaction.description,
                    transtype: transactionType,
                    categories: expenseCategory
                },
                update: (cache, { data }) => {
                    const newTransaction = data.addTransaction;
                    const existingTransactions = cache.readQuery({ query: GET_TRANSACTIONS });
                    if (existingTransactions) {
                        cache.writeQuery({
                            query: GET_TRANSACTIONS,
                            data: {
                                transactions: [...existingTransactions.transactions, newTransaction],
                            },
                        });
                    }
                },
            }).then(() => {
                setNewTransaction({ description: '', amount: '' });
            }).catch((error) => {
                console.error("Error adding transaction:", error);
            });
        } else {
            console.log('Invalid transaction data');
        }
    };

    const handleUpdateTransactionAmount = async () => {
        try {
            if (transactionToUpdate) {
                const updatedTransaction = {
                    transID: transactionToUpdate.transID,
                    newTransAmt: newTransactionAmount !== '' ? parseFloat(newTransactionAmount) : transactionToUpdate.transAmt,
                    newTransDesc: newTransaction.description !== '' ? newTransaction.description : transactionToUpdate.transDesc,
                };

                const { data } = await updateTransactionAmountMutation({
                    variables: updatedTransaction,
                });
                console.log('Transaction updated:', data.updateTransactionAmount);
                refetchTransactions();

                // Clear the fields in the dialog
                setNewTransactionAmount('');
                setNewTransaction({ ...newTransaction, description: '' });
            }
            closeUpdateDialog();
        } catch (error) {
            console.error("Error updating transaction:", error);
        }
    };


    // Function to open the update dialog
    const openUpdateDialog = (transaction) => {
        setIsUpdateDialogOpen(true);
        setNewTransactionAmount("");
        setTransactionToUpdate(transaction); // Set the transaction to update
    };

    // Function to close the update dialog
    const closeUpdateDialog = () => {
        setIsUpdateDialogOpen(false);
        setNewTransactionAmount("");
        setTransactionToUpdate(null); // Clear the transactionToUpdate state
    };

    const deleteTransaction = (transID) => {
        deleteTransactionMutation({
            variables: {
                transID: transID,
            },
        })
            .then(() => {
                refetchTransactions();
            })
            .catch((error) => {
                console.error("Error deleting transaction:", error);
            });
    };

    const refetchTransactions = () => {
        refetch();
    };

    document.body.style.backgroundColor = '#B0C4DE';;

    return (

        <Container style={containerStyle}>
            <Container style={containerStyle}>
                <AppBar position="fixed" style={{ backgroundColor: '#475ACA' }}>
                    <Toolbar>
                        <Box display="flex" justifyContent="space-between" width="100%">
                            <Box>
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/3/3f/Kaplan%2C_Inc._logo.svg"
                                    alt="Description of the image"
                                    width="200"
                                    height="100"
                                />
                            </Box>
                            <Box>
                                <Typography variant="h5" color="inherit" style={{ fontSize: '65px', color: '#000070' }}>
                                    SmartSplit
                                </Typography>
                            </Box>
                        </Box>
                    </Toolbar>
                </AppBar>
                <br /><br /><br /><br /><br /><br /><br /><br />
            </Container>

            <Grid container spacing={2} justifyContent="space-around">
                <Grid item>
                    <TextField variant="filled" margin="dense"
                        type="search"
                        placeholder="Amount"
                        value={newTransaction.amount}
                        onChange={handleAmountChange}
                        error={Boolean(errorMessage)}
                        helperText={errorMessage}
                        InputProps={{ style: { backgroundColor: 'white', borderBottom: '2px solid #000' } }}
                    />
                </Grid>
                <Grid item>
                    <TextField
                        variant="filled"
                        margin="dense"
                        type="text"
                        placeholder="Description"
                        value={newTransaction.description}
                        onChange={(e) => {
                            const inputText = e.target.value;
                            const isValidText = /^[a-zA-Z\s]*$/.test(inputText);

                            if (!isValidText) {
                                setTextWarning('Please enter a valid text description.');
                            } else {
                                setNewTransaction({ ...newTransaction, description: inputText });
                                setTextWarning(''); // Clear the warning
                            }
                        }}
                        error={Boolean(textWarning)}
                        helperText={textWarning}
                        InputProps={{
                            style: {
                                backgroundColor: 'white', borderBottom: '2px solid #000'
                            }
                        }}
                    />

                </Grid>
                <Grid item>
                    <Select variant="filled" margin="dense"
                        value={transactionType}
                        onChange={(e) => setTransactionType(e.target.value)}
                        style={{ width: '100%', background: 'white', borderBottom: '2px solid #000' }}
                    >
                        <MenuItem value="Expense">Expense</MenuItem>
                        <MenuItem value="Income">Income</MenuItem>
                    </Select>
                </Grid>
                <Grid item>
                    <Select variant="filled" margin="dense"
                        value={expenseCategory}
                        onChange={(e) => setexpenseCategory(e.target.value)}
                        style={{ background: 'white', borderBottom: '2px solid #000' }}
                    >
                        <MenuItem value="Needs">Needs</MenuItem>
                        <MenuItem value="Education">Education</MenuItem>
                        <MenuItem value="Tax">Tax</MenuItem>
                        <MenuItem value="Luxury">Luxury</MenuItem>
                        <MenuItem value="Miscellaneous">Miscellaneous</MenuItem>
                    </Select>
                    <InputLabel htmlFor="expense-category-select">If an Expense, Add Category</InputLabel>
                </Grid>
            </Grid>
            <br />
            <Grid container spacing={2} justifyContent="space-around">
                <Grid item>
                    <Button variant="contained" onClick={handleAddTransaction}>Add Transaction</Button>
                </Grid>
            </Grid>
            <br />
            <Typography variant="h4" textAlign="center">Balance: ₹{formattedBalance}</Typography>
            <div>
                <Container>
                    {data.transactions.length > 0 && (
                        <Paper elevation={3} style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.transactions.map((transaction, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{transaction.transDesc}</TableCell>
                                            <TableCell>₹{transaction.transAmt}</TableCell>
                                            <TableCell>{transaction.transtype}</TableCell>
                                            <TableCell>
                                                <Button onClick={() => deleteTransaction(transaction.transID)}>Delete</Button>
                                                <Button onClick={() => openUpdateDialog(transaction)}>Update</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    )}
                </Container>

                {/* Update Dialog */}
                <Dialog open={isUpdateDialogOpen} onClose={closeUpdateDialog}>
                    <DialogTitle>Update Transaction</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="New Amount"
                            type="number"
                            value={newTransactionAmount}
                            onChange={(e) => setNewTransactionAmount(e.target.value)}
                        />
                        <TextField
                            label="New Description"
                            type="text"
                            value={newTransaction.description}
                            onChange={(e) => {
                                const inputText = e.target.value;
                                const isValidText = /^[a-zA-Z\s]*$/.test(inputText);

                                if (!isValidText) {
                                    setTextWarning('Please enter a valid text description.');
                                } else {
                                    setNewTransaction({ ...newTransaction, description: inputText });
                                    setTextWarning(''); // Clear the warning
                                }
                            }}
                            error={Boolean(textWarning)}
                            helperText={textWarning}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeUpdateDialog} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateTransactionAmount} color="primary">Update</Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Container>
    );
}

export default AddIncome;