import _ from 'underscore';
import { SubscriptionParams } from '../../models/subscriptionParams';
import { NotificationType, supportedNotificationTypes } from '../../models/notificationType';
import { CallbackData, CallbackDataType } from "../../models/callbackData";
import { ErrorHandler } from '../../helpers/errorHandler';
import { TelegramInlineKeyboardHelper } from '../../helpers/telegramInlineKeyboardHelper';
import commandMessages from '../../utils/commandMessages';

export class SubscriptionsController {
    constructor(telegramBot, iotClient) {
        this.bot = telegramBot;
        this.iotClient = iotClient;
        this.supportedCallbackDataTypes = [
            CallbackDataType.selectNotificationType,
            CallbackDataType.selectThingForNotifications
        ];
        this.subscriptionParamsByChat = [];
        this.errorHandler = new ErrorHandler(telegramBot);
    }
    handleSubscribeCommand(msg) {
        const chatId = msg.chat.id;
        this._startSubscribing(chatId);
    }
    canHandleCallbackData(callbackData) {
        return _.contains(this.supportedCallbackDataTypes, callbackData.type);
    }
    handleCallbackQuery(callbackQuery, callbackData) {
        const chatId = callbackQuery.message.chat.id;
        const subscriptionParams = this._getOrCreateSubscriptionParams(chatId);
        const answerCallbackQuery = () => this.bot.answerCallbackQuery(callbackQuery.id);
        const reset = () => {
            answerCallbackQuery();
            this._startSubscribing(chatId);
        };

        switch (callbackData.type) {
            case CallbackDataType.selectNotificationType: {
                if (_.isUndefined(subscriptionParams.notificationType)) {
                    subscriptionParams.setNotificationType(callbackData.data);
                    this._selectThing(chatId, subscriptionParams, answerCallbackQuery);
                } else {
                    reset()
                }
                break;
            }
            case CallbackDataType.selectThingForNotifications: {
                if (_.isUndefined(subscriptionParams.thing)) {
                    subscriptionParams.setThing(callbackData.data);
                    this._selectObservationType(chatId, subscriptionParams, answerCallbackQuery);
                } else {
                    reset()
                }
                break;
            }
        }
    }
    _startSubscribing(chatId) {
        this._deleteSubscriptionParams(chatId);
        this._selectNotificationType(chatId);
    }
    _selectNotificationType(chatId) {
        const inlineKeyboardButtons = _.map(supportedNotificationTypes, (notificationType) => {
            const callbackData = new CallbackData(CallbackDataType.selectNotificationType, notificationType);
            return {
                text: notificationType,
                callback_data: callbackData.serialize()
            }
        });
        const options = {
            reply_markup: {
                inline_keyboard: TelegramInlineKeyboardHelper.rows(inlineKeyboardButtons)
            }
        };
        this.bot.sendMessage(chatId, commandMessages.notificationTypeSelectMessage, options)
    }
    async _selectThing(chatId, subscriptionParams, answerCallbackQuery) {
        const getThingsRequestParams = SubscriptionsController._getThingsRequestParams(subscriptionParams);
        try {
            const response = await this.iotClient.thingsService.getThings(getThingsRequestParams.supportsMeasurements,
                                                                            getThingsRequestParams.supportsEvents);
            const inlineKeyboardButtons = _.map(response.body.things, (thing) => {
                const callbackData = new CallbackData(CallbackDataType.selectThingForNotifications, thing.name);
                return {
                    text: thing.name,
                    callback_data: callbackData.serialize()
                }
            });
            const options = {
                reply_markup: {
                    inline_keyboard: TelegramInlineKeyboardHelper.rows(inlineKeyboardButtons)
                }
            };
            answerCallbackQuery();
            this.bot.sendMessage(chatId, commandMessages.thingSelectMessage, options);
        } catch (err) {
            answerCallbackQuery();
            this.errorHandler.handleThingsError(err, chatId);
        }
    }
    async _selectObservationType(chatId, subscriptionParams, answerCallbackQuery) {
        try {
            const observationTypes = await this._getObservationTypes(subscriptionParams);
            const inlineKeyboardButtons = _.map(observationTypes, (observationType) => {
                const callbackData = new CallbackData(CallbackDataType.selectObservationType, observationType);
                return {
                    text: observationType,
                    callback_data: callbackData.serialize()
                }
            });
            const options = {
                reply_markup: {
                    inline_keyboard: TelegramInlineKeyboardHelper.rows(inlineKeyboardButtons)
                }
            };
            answerCallbackQuery();
            this.bot.sendMessage(chatId, commandMessages.observationTypeSelectMessage, options);
        } catch (err) {
            answerCallbackQuery();
            this.errorHandler.handleObservationTypesError(err, chatId);
        }

    }
    static _getThingsRequestParams(subscriptionParams) {
        const supportsMeasurementParams = {
            supportsMeasurements: true,
            supportsEvents: false
        };
        const supportsEventParams = {
            supportsMeasurements: false,
            supportsEvents: true
        };
        switch (subscriptionParams.notificationType) {
            case NotificationType.event: {
                return supportsEventParams;
            }
            case NotificationType.measurement: {
                return supportsMeasurementParams;
            }
            case NotificationType.measurementChanged: {
                return supportsMeasurementParams;
            }
        }
    }
    async _getObservationTypes(subscriptionParams) {
        let res;
        try {
            res = await this.iotClient.thingService.getThingByName(subscriptionParams.thing);
        } catch (err) {
            throw err;
        }
        const thing = res.body;
        const observationTypesForEvents = thing.supportedObservationTypes.event;
        const observationTypesForMeasurements = thing.supportedObservationTypes.measurement;
        switch (subscriptionParams.notificationType) {
            case NotificationType.event: {
                return observationTypesForEvents;
            }
            case NotificationType.measurement: {
                return observationTypesForMeasurements;
            }
            case NotificationType.measurementChanged: {
                return observationTypesForMeasurements;

            }
        }
    }
    _deleteSubscriptionParams(chatId) {
        const subscriptionParamsIndex = _.findIndex(this.subscriptionParamsByChat, (subscriptionParams) => {
            return subscriptionParams.chatId = chatId;
        });
        if (subscriptionParamsIndex !== -1) {
            this.subscriptionParamsByChat.splice(subscriptionParamsIndex, 1);
        }
    }
    _getOrCreateSubscriptionParams(chatId) {
        let subscriptionParams = _.find(this.subscriptionParamsByChat, (subscriptionParams) => {
            return subscriptionParams.chatId = chatId;
        });
        if (_.isUndefined(subscriptionParams)) {
            subscriptionParams = new SubscriptionParams(chatId);
            this.subscriptionParamsByChat.push(subscriptionParams);
            return subscriptionParams;
        } else {
            return subscriptionParams;
        }
    }
}