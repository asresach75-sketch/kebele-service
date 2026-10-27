function mapUserApiError(error, fallbackMessage = 'Server error.') {
  if (!error) {
    return { status: 500, message: fallbackMessage };
  }

  if (error.code === 11000) {
    return {
      status: 400,
      message: 'This email or phone already exists.'
    };
  }

  if (error.name === 'ValidationError') {
    const validationMessage = Object.values(error.errors || {})
      .map((fieldError) => fieldError && fieldError.message)
      .filter(Boolean)
      .join('. ');

    return {
      status: 400,
      message: validationMessage || fallbackMessage
    };
  }

  if (error.name === 'CastError') {
    return {
      status: 400,
      message: fallbackMessage
    };
  }

  return {
    status: 500,
    message: error.message || fallbackMessage
  };
}

module.exports = { mapUserApiError };
