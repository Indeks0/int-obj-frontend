import {
    Grid,
    Switch,
    Typography,
    Paper,
    Box,
    TextField,
    Icon,
    Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import moment from "moment";
import "moment/locale/hr";
import { createRef, useEffect, useRef, useState } from "react";
import { Chart } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    TimeScale,
    Legend,
} from "chart.js";
import DoneOutlineIcon from "@mui/icons-material/DoneOutline";
import "chartjs-adapter-moment";
import { Line } from "react-chartjs-2";
import NotInterestedIcon from "@mui/icons-material/NotInterested";

function App() {
    const [checked, setChecked] = useState(false);
    const [systemToggleInfo, setSystemToggleInfo] = useState([]);
    const [temperatureData, setTemperatureData] = useState([]);
    const [tempThreshold, setTempThreshold] = useState(null);
    const chartTempValues = [];
    const chartTempSensorValues = [];

    const chartReference = useRef(null);

    function getDate(params) {
        return `${moment(params.row.dateCreated).format(
            "dddd DD. MM. YYYY., HH:mm"
        )}`;
    }

    function getAction(params) {
        return `${params.row.changedTo === true ? "Paljenje" : "Gašenje"}`;
    }

    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        TimeScale,
        LineElement,
        Title,
        Tooltip,
        Legend
    );

    const columns1 = [
        { field: "id", headerName: "Id", width: 100 },
        {
            field: "changedTo",
            headerName: "Akcija",
            width: 200,
            valueGetter: getAction,
        },
        {
            field: "dateCreated",
            headerName: "Vrijeme",
            width: 300,
            valueGetter: getDate,
        },
    ];

    const columns2 = [
        { field: "id", headerName: "Id", width: 100 },
        {
            field: "temp",
            headerName: "Postavljena temperatura",
            width: 200,
        },
        {
            field: "tempSensor",
            headerName: "Izmjerena temperatura",
            width: 200,
        },
        {
            field: "dateCreated",
            headerName: "Vrijeme",
            width: 300,
            valueGetter: getDate,
        },
        {
            field: "isEnabled",
            headerName: "Hlađenje aktivno",
            width: 300,
            renderCell: (params) => (
                <div>
                    {params.row.isEnabled === true ? (
                        <Icon>
                            <DoneOutlineIcon sx={{ color: "green" }} />
                        </Icon>
                    ) : (
                        <Icon>
                            <NotInterestedIcon sx={{ color: "red" }} />
                        </Icon>
                    )}
                </div>
            ),
        },
    ];
    const handleGetToggle = async () => {
        axios
            .get("http://arduino-int-obj.herokuapp.com/Arduino/is-enabled")
            .then(function (response) {
                setChecked(response.data.isEnabled);
                setTempThreshold(response.data.temperature);
            });
    };

    const handleGetSystemToggleInfo = async () => {
        axios
            .get(
                "http://arduino-int-obj.herokuapp.com/Arduino/get-system-toggle-info"
            )
            .then(function (response) {
                setSystemToggleInfo(response.data.items);
            });
    };

    const getChartValues = async () => {
        axios
            .get(
                "http://arduino-int-obj.herokuapp.com/Arduino/get-temperature-info"
            )
            .then(function (response) {
                setTemperatureData(response.data.items);
            });
    };

    const handleChange = async (event) => {
        axios
            .put(
                `http://arduino-int-obj.herokuapp.com/Arduino/update-isEnabled?nextValue=${event.target.checked}`
            )
            .then(function (response) {});

        setChecked(event.target.checked);

        axios
            .post(
                `http://arduino-int-obj.herokuapp.com/Arduino/post-system-toggle-info?nextValue=${event.target.checked}`
            )
            .then(function (response) {});
    };

    const handleTemperatureChange = async (event) => {
        setTempThreshold(event.target.value);
    };

    const handleTemperatureChangeSubmit = async (event) => {
        axios
            .put(
                `http://arduino-int-obj.herokuapp.com/Arduino/update-temperature?nextValue=${tempThreshold}`
            )
            .then(function (response) {});
    };

    useEffect(() => {
        handleGetToggle();
    }, []);

    useEffect(() => {
        setTimeout(handleGetSystemToggleInfo, 1000);
    }, [checked]);

    useEffect(() => {
        const interval = setInterval(function () {
            getChartValues();
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Grid container justifyContent="center" sx={{ p: 2 }}>
            <Grid item xs={12}>
                <Typography textAlign="center" variant="h2">
                    Arduino projekt
                </Typography>
            </Grid>
            <Grid item xs={12} container spacing={10} justifyContent="center">
                <Grid item xs={4}>
                    <Paper elevation={2} sx={{ p: 2, minHeight: 322 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="h5">Pali/Gasi</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Switch
                                    checked={checked}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="h5" sx={{ pt: 5 }}>
                                    Temperaturna granica
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    type="number"
                                    inputMode="decimal"
                                    value={tempThreshold}
                                    onChange={handleTemperatureChange}
                                ></TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    onClick={handleTemperatureChangeSubmit}
                                >
                                    Spremi Temperaturu
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
                <Grid item xs={7}>
                    <Paper elevation={2}>
                        <Typography textAlign="center">
                            Vremena upravljanja sustavom
                        </Typography>
                        <Box sx={{ height: 330, width: "100%" }}>
                            {systemToggleInfo?.length > 0 ? (
                                <DataGrid
                                    rows={systemToggleInfo}
                                    columns={columns1}
                                    pageSize={5}
                                    rowsPerPageOptions={[5]}
                                    disableSelectionOnClick
                                />
                            ) : null}
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={11}>
                    <Paper elevation={2}>
                        <Typography textAlign="center">
                            Izmjerene vrijednosti tijekom rada
                        </Typography>
                        <Box sx={{ height: 350, width: "100%" }}>
                            {systemToggleInfo?.length > 0 ? (
                                <DataGrid
                                    rows={temperatureData}
                                    columns={columns2}
                                    pageSize={5}
                                    rowsPerPageOptions={[5]}
                                    disableSelectionOnClick
                                />
                            ) : null}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Grid>
    );
}

export default App;
