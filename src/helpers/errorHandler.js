import _ from 'underscore';
import httpStatus from 'http-status';
import errorMessages from '../utils/errorMessages'
import log from '../utils/log';
import { MarkdownBuilder } from '../helpers/markdownBuilder';

export class ErrorHandler {
    constructor(telegramBot) {
        this.bot = telegramBot;
    }
    handleThingsError(err, chatId) {
        this.handleError(err, chatId, errorMessages.noThingsAvailable, errorMessages.errorGettingThings);
    }
    handleTimePeriodsError(err, chatId) {
        this.handleError(err, chatId, errorMessages.noTimePeriodsAvailable, errorMessages.errorGettingTimePeriods)
    }
    handleStatsError(err, chatId) {
        this.handleError(err, chatId, errorMessages.noStatsAvailable, errorMessages.errorGettingStats)
    }
    handleCreateSubscriptionError(err, chatId) {
        if (_.isEqual(err.statusCode, httpStatus.CONFLICT)) {
            const topic = err.body.topic;
            const markdown = MarkdownBuilder.buildAlreadySubscribedMD(topic);
            const options = {
                parse_mode: "Markdown"
            };
            this.bot.sendMessage(chatId, markdown, options);
        } else {
            this.handleError(err, chatId, undefined, errorMessages.errorSubscribing)
        }
    }
    handleDeleteSubscriptionError(err, chatId) {
        this.handleError(err, chatId, errorMessages.deleteSubscriptionNotFound, errorMessages.errorDeleteSubscription);
    }
    handleGetSubscriptionsError(err, chatId) {
        this.handleError(err, chatId, errorMessages.noSubscriptions, errorMessages.errorGettingSubscriptions);
    }
    handleGetTopicsError(err, chatId) {
        this.handleError(err, chatId, errorMessages.noTopics, errorMessages.errorGettingTopics);
    }
    handleError(err, chatId, notFoundMessage, errorMessage) {
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