function notFound(_request, response) {
  return response.status(404).json({ message: 'Route not found' });
}

module.exports = { notFound };
