const CallbackDataType = Object.freeze({
    selectThing: "selectThing",
    selectTimePeriod: "selectTimePeriod",
    selectNotificationType: "selectNotificationType",
    selectThingForNotifications: "selectThingForNotifications",
    selectObservationType: "selectObservationType",
    selectSubscription: "selectSubscription"
});

class CallbackData {
    constructor(callbackDataType, data) {
        this.type = callbackDataType;
        this.data = data;
    }
    serialize() {
        const json = {
            type: this.type,
            data: this.data
        };
        return JSON.stringify(json);
    }
    static deserialize(stringJSON) {
        const json = JSON.parse(stringJSON);
        return new CallbackData(json.type, json.data);
    }
}

export { CallbackDataType, CallbackData };