import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const PredictionPriceCard = ({ flatType, town, floorArea, leaseCommenceDate }) => {
    const [prices, setPrices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const screenWidth = Dimensions.get('window').width;

    const getCurrentYearAndMonth = () => {
        const date = new Date();
        return { year: date.getFullYear(), month: date.getMonth() + 1 };
    };

    const fetchData = async (query) => {
        const response = await fetch(`http://localhost:3000/prediction/property-prices?flatType=${encodeURIComponent(flatType)}&town=${encodeURIComponent(town)}&floor_area_sqm=${floorArea}&year=${query.year}&month=${query.month}&lease_commence_date=${leaseCommenceDate}`);
        const data = await response.json();
        return data.predictedPrice;
    };

    const formatPriceWithCommas = (price) => {
        let formattedPrice = price * 1000;
        formattedPrice = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        formattedPrice = parseFloat(formattedPrice).toFixed(1);
        return formattedPrice;
    };

    function getMonthNameFromNumber(monthNumber) {
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
    
        if (monthNumber >= 1 && monthNumber <= 12) {
            return monthNames[monthNumber - 1];
        } else {
            return 'Invalid Month';
        }
    }

    useEffect(() => {
        const { year, month } = getCurrentYearAndMonth();
        const dataFetchPromises = [];
        const startYear = year - 1; // Starting 3 years back
        const endYear = year + 3; // Going to 2 years forward
        let currentMonth = month;
    
        for (let i = 0; i < 8; i++) { // Fetch data for 8 data points (4 years, every 6 months)
            let currentYear = startYear + Math.floor((currentMonth + i * 6 - 1) / 12); // Calculate the current year
            currentMonth = (currentMonth + i * 6 - 1) % 12 + 1; // Calculate the current month
    
            dataFetchPromises.push(fetchData({ year: currentYear, month: currentMonth }));
        }
    
        Promise.all(dataFetchPromises).then(fetchedPrices => {
            const chartData = fetchedPrices.map((price, index) => {
                const labelMonth = (currentMonth + index * 6) % 12; // Calculate the month for the label
                const labelYear = startYear + Math.floor((currentMonth + index * 6) / 12); // Calculate the year for the label
                const formattedDate = `${getMonthNameFromNumber(labelMonth)} ${labelYear.toString().slice(-2)}`;
                return {
                    value: price / 1000,
                    year: formattedDate,
                    labelComponent: () => (
                        <Text style={styles.yearText}>
                            {"     "}{getMonthNameFromNumber(labelMonth)} {labelYear.toString().slice(-2)}
                        </Text>
                    ),
                };
            });
            setTimeout(() => {
                setPrices(chartData); // Set prices after a delay
                setIsLoading(false); // Update isLoading state to false
            }, 3000); // Delay for 3 seconds
        }).catch(error => {
            console.error('Error fetching prediction data:', error);
        });
    }, [flatType, town, floorArea, leaseCommenceDate]);
    
    
    

    const dPoint = () => {
        return (
            <View
                style={{
                    width: 14,
                    height: 14,
                    backgroundColor: 'white',
                    borderWidth: 3,
                    borderRadius: 7,
                    borderColor: '#07BAD1',
                }}
            />
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Price Prediction</Text>
            {prices.length > 0 && !isLoading ? (
                <LineChart
                    isAnimated
                    thickness={5}
                    color="#FFD700"
                    noOfSections={4}
                    animateOnDataChange
                    // hideDataPoints
                    rotateLabel
                    yAxisTextStyle={{ color: 'gray' }}
                    yAxisSide='right'
                    animationDuration={1000}
                    onDataChangeAnimationDuration={500}
                    areaChart
                    pointerConfig={{
                        pointerStripHeight: 160,
                        pointerStripColor: 'lightgray',
                        pointerStripWidth: 2,
                        pointerColor: 'lightgray',
                        radius: 6,
                        pointerLabelWidth: 100,
                        pointerLabelHeight: 90,
                        activatePointersOnLongPress: true,
                        autoAdjustPointerLabelPosition: false,
                        pointerLabelComponent: items => {
                            return (
                                <View
                                    style={{
                                        height: 90,
                                        width: 100,
                                        justifyContent: 'center',
                                        marginTop: -30,
                                        marginLeft: -40,
                                    }}>
                                    <Text style={{ color: 'black', fontSize: 14, marginBottom: 6, textAlign: 'center' }}>
                                        {items[0].year}
                                    </Text>

                                    <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 5, backgroundColor: 'black' }}>
                                        <Text style={{ fontWeight: 'bold', textAlign: 'center', color: 'white' }}>
                                            {'S$ ' + formatPriceWithCommas(items[0].value) + 'k'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        },
                    }}
                    pointerLabelComponent
                    data={prices}
                    maxValue={1000}
                    height={200}
                    width={screenWidth - 112}
                    curved
                    noOfSectionsBelowXAxis={0}
                    // hideDataPoints
                    startFillColor={'#FFD700'}
                    endFillColor={'rgb(84,219,234)'}
                    startOpacity={0.4}
                    endOpacity={0.1}
                    // stepValue={100}
                    spacing={58}
                    backgroundColor="white"
                    rulesColor="gray"
                    rulesType="solid"
                    initialSpacing={20}
                    yAxisColor="lightgray"
                    xAxisColor="lightgray"
                    renderYAxisLabel={(value) => `S$ ${value}k`}
                    startFromZero={true}
                />
            ) : (
                <Text styles={styles.loadingText}>Loading...</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 20,
        margin: 20,
        paddingTop: 20,
        marginBottom: 30,
        paddingBottom: 50,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 2,
        // alignItems: 'center', // Center chart in card
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: -5,
        marginBottom: 20,
        paddingLeft: 12,
    },
    yearText: {
        fontSize: 11,
        // color: 'white',
    },
    loadingText: {
        fontSize: 16,
        paddingVertical: 50,
        color: 'gray',
        textAlign: 'center',
        justifyContent: 'center',
    },
});

export default PredictionPriceCard;
