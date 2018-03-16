import _ from 'underscore';
import httpStatus from 'http-status';
import errorMessages from '../utils/errorMessages'
import log from '../utils/log';

export class ErrorHandler {
    constructor(telegramBot) {
        this.bot = telegramBot;
    }
    handleThingsError(err, chatId) {
        this._handleError(err, chatId, errorMessages.noThingsAvailable, errorMessages.errorGettingThings);
    }
    handleTimePeriodsError(err, chatId) {
        this._handleError(err, chatId, errorMessages.noTimePeriodsAvailable, errorMessages.errorGettingTimePeriods)
    }
    handleStatsError(err, chatId) {
        this._handleError(err, chatId, errorMessages.noStatsAvailable, errorMessages.errorGettingStats)
    }
    handleObservationTypesError(err, chatId) {
        this._handleError(err, chatId, errorMessages.noObservationTypesAvailable, errorMessages.errorGettingObservationTypes);
    }
    handleCreateSubscriptionError(err, chatId) {
        this._handleError(err, chatId, undefined, errorMessages.errorSubscribing)
    }
    handleGetSubscriptionsError(err, chatId) {
        this._handleError(err, chatId, errorMessages.noSubscriptions, errorMessages.errorGettingSubscriptions);
    }
    _handleError(err, chatId, notFoundMessage, errorMessage) {
        log.logError(err);
        if (_.isEqual(err.statusCode, httpStatus.NOT_FOUND)) {
            const notFoundError = _.isUndefined(notFoundMessage) ? errorMessages.errorGenericNotFound : notFoundMessage;
            this.bot.sendMessage(chatId, notFoundError);
        } else {
            const error = _.isUndefined(errorMessage) ? errorMessages.errorGeneric : errorMessage;
            this.bot.sendMessage(chatId, error);
        }
    }
}