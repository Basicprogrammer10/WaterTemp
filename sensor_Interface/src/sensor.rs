use super::common;
use rand::Rng;
use std::fs;

/// Defines a sensor.
///
/// A sensor contains a Device ID, a Friendly Name and a calibration factor.
pub struct Sensor {
    pub id: String,
    pub name: String,
    pub calibration: Option<f64>,
    pub debug: bool,
}

/// All the info sent bu the system about a sensor.
///
/// This info will be send for each sensor when /temp is requested.
pub struct Value {
    pub id: String,
    pub name: String,
    pub value: f64,
}

/// Implementation of a sensor.
impl Sensor {
    /// Creates a new sensor.
    /// ## Example
    /// ```rust
    /// let sensor = Sensor::new("00000bdf4372", "Water", None, false);
    /// ```
    pub fn new(id: &str, name: &str, calibration: Option<f64>, debug: bool) -> Sensor {
        Sensor {
            id: id.to_string(),
            name: name.to_string(),
            calibration: calibration,
            debug: debug,
        }
    }

    /// Get the current temperature of a sensor.
    pub fn get_temperature(&self) -> Option<f64> {
        let cal = self.calibration.unwrap_or(0.0);

        if self.debug {
            let mut rng = rand::thread_rng();
            return Some(rng.gen_range::<f64>(0.0, 10.0) + cal);
        }

        let sensor_data = get_sensor_data(&self.id[..]);
        let temp: Vec<&str> = sensor_data.split("t=").collect();
        if temp.len() != 2 {
            format!("{}", common::color("[-] Error Parsing Sensor Data :/", 31));
            return None;
        }
        let temp_str = temp[1].to_string();
        let temp_c = temp_str
            .parse::<f64>()
            .expect("Failed to parse temperature")
            / 1000.0;
        let temp_f = temp_c * 9.0 / 5.0 + 32.0;
        Some(temp_f + cal)
    }

    pub fn clone(&self) -> Sensor {
        Sensor {
            id: self.id.clone(),
            name: self.name.clone(),
            calibration: self.calibration.clone(),
            debug: self.debug.clone(),
        }
    }
}

impl Value {
    pub fn new(id: &String, name: &String, value: f64) -> Value {
        Value {
            id: id.clone(),
            name: name.clone(),
            value: value,
        }
    }
}

/// Get rew sensor data
///
/// **Not in a useable format yet**
fn get_sensor_data(dev_id: &str) -> String {
    let mut dev_path = format!("/sys/bus/w1/devices/{}/w1_slave", dev_id);
    let sensor_data = fs::read_to_string(&mut dev_path).expect("Failed to read sensor data");
    let sensor_data_lines: Vec<&str> = sensor_data.split('\n').collect();
    if &common::remove_whitespace(
        sensor_data_lines[0][sensor_data_lines[0].len() - 3..sensor_data_lines[0].len()]
            .to_string(),
    ) != "YES"
    {
        return get_sensor_data(dev_id);
    }
    sensor_data_lines[1].to_string()
}

/// Get sensor data for all sensors
pub fn get_all_temp(sensors: &[Sensor]) -> Vec<Value> {
    let mut values: Vec<Value> = Vec::new();

    for i in sensors.iter() {
        values.push(Value::new(&i.id, &i.name, i.get_temperature().unwrap()));
    }
    values
}

/// Get data history from disk
pub fn get_history(log_file: &String) -> Option<String> {
    match fs::read_to_string(log_file) {
        Ok(data) => Some(data),
        Err(_) => None,
    }
}

/// Get all the sensors defined in the config file
///
/// Returns a vector of sensors
pub fn get_sensors(data: &Vec<[String; 2]>, debug: bool) -> Vec<Sensor> {
    let mut sensors: Vec<Sensor> = Vec::new();
    for i in data.iter() {
        if i[0].contains("sensor_") {
            let friendly_name =
                common::remove_whitespace(i[0].split("_").collect::<Vec<&str>>()[1].to_string());
            let sensor_id =
                common::remove_whitespace(i[1].split(",").collect::<Vec<&str>>()[0].to_string());
            let calibration =
                common::remove_whitespace(i[1].split(",").collect::<Vec<&str>>()[1].to_string());

            sensors.push(Sensor::new(
                &sensor_id[..],
                &friendly_name[..],
                Some(calibration.parse::<f64>().unwrap()),
                debug,
            ));
        }
    }
    sensors
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_temperature_1() {
        let sensor = Sensor::new("", "Water", None, true);
        let number: f64 = sensor.get_temperature().unwrap();
        assert!(number >= 0.0 && number < 10.0);
    }

    #[test]
    fn test_get_temperature_cal() {
        let sensor = Sensor::new("", "Water", Some(10.0), true);
        let number: f64 = sensor.get_temperature().unwrap();
        assert!(number >= 10.0 && number < 20.0);
    }
}
