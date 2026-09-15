TEMPERATURE_LIMIT = 40.0


def check_temperature_alert(temperature):

    if temperature is not None and temperature > TEMPERATURE_LIMIT:
        return {
            "alert": True,
            "type": "HIGH_TEMPERATURE",
            "severity": "CRITICAL",
            "message": "Temperature is above safe limit"
        }

    return {
        "alert": False,
        "type": None,
        "severity": "NORMAL",
        "message": "Temperature is normal"
    }


def check_tamper_alert(tamper):

    if tamper:
        return {
            "alert": True,
            "type": "UNAUTHORIZED_LID_OPENING",
            "severity": "CRITICAL",
            "message": "Unauthorized lid opening detected"
        }

    return {
        "alert": False,
        "type": None,
        "severity": "NORMAL",
        "message": "Lid is secure"
    }


def check_shock_alert(shock):

    if shock:
        return {
            "alert": True,
            "type": "SHOCK_DETECTED",
            "severity": "CRITICAL",
            "message": "Sudden shock or impact detected"
        }

    return {
        "alert": False,
        "type": None,
        "severity": "NORMAL",
        "message": "No abnormal shock detected"
    }


def check_motion_alert(motion):

    if motion:
        return {
            "alert": True,
            "type": "MOTION_DETECTED",
            "severity": "WARNING",
            "message": "Motion detected near the Military Box"
        }

    return {
        "alert": False,
        "type": None,
        "severity": "NORMAL",
        "message": "No motion detected"
    }