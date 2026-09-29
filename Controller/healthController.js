function getHealth(_request, response) {
  return response.status(200).json({ status: 'ok', service: 'car-rental-api' });
}

module.exports = { getHealth };
