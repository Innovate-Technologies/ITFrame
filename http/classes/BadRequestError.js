import ExtendableError from "app/components/ExtendableError";

export default class BadRequestError extends ExtendableError {
    constructor(m) {
        super(m);
    }
}
