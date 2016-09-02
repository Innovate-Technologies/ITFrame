import ExtendableError from "app/components/ExtendableError";

export default class AccessDeniedError extends ExtendableError {
    constructor(m) {
        super(m);
    }
}
