import { useState, useRef, useCallback } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import useAutoRefresh from '../../../hooks/useAutoRefresh';
import {
  Button,
  TextField,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardActionArea,
  IconButton,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SearchIcon from '@mui/icons-material/Search';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';

const API = '/api/v1/minimart';

export default function MinimartPOS() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [cash, setCash] = useState('');
  const searchRef = useRef();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`${API}/products`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load products.');
    }
  }, []);

  useAutoRefresh(fetchProducts);

  const filtered = products.filter(
    (p) =>
      p.quantity > 0 &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.includes(search)),
  );

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev; // cap at stock
        return prev.map((i) =>
          i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          maxStock: product.quantity,
        },
      ];
    });
  }

  function changeQty(productId, delta) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(i.quantity + delta, i.maxStock) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const change = cash ? Number(cash) - total : 0;

  async function handleCheckout() {
    if (cart.length === 0) {
      setError('Cart is empty.');
      return;
    }
    if (cash && Number(cash) < total) {
      setError('Cash is less than total amount.');
      return;
    }
    try {
      const res = await axiosInstance.post(`${API}/pos/checkout`, {
        items: cart.map(({ productId, name, price, quantity }) => ({
          productId,
          name,
          price,
          quantity,
        })),
        total,
      });
      setReceipt({ ...res.data, cashGiven: Number(cash), change });
      setCart([]);
      setCash('');
      setSearch('');
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed.');
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Point of Sale
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ height: 'calc(100vh - 160px)' }}>
        {/* Left — product search */}
        <Grid item xs={12} md={7} sx={{ height: '100%' }}>
          <Paper
            elevation={2}
            sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <Box display="flex" gap={1} mb={2} alignItems="center">
              <SearchIcon color="action" />
              <TextField
                inputRef={searchRef}
                label="Search product or SKU"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                fullWidth
              />
            </Box>

            {/* Scrollable cards area */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <Grid container spacing={1}>
                {filtered.map((p) => (
                  <Grid item xs={6} sm={4} key={p._id}>
                    <Card
                      elevation={1}
                      sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        overflow: 'hidden',
                        '&:hover': { borderColor: '#1976d2', boxShadow: 3 },
                        transition: 'box-shadow 0.2s, border-color 0.2s',
                      }}
                    >
                      <CardActionArea onClick={() => addToCart(p)}>
                        {/* Square image area — 3:4 ratio */}
                        <Box
                          sx={{
                            position: 'relative',
                            paddingTop: '75%',
                            width: '100%',
                            backgroundColor: '#f0f0f0',
                          }}
                        >
                          {p.image ? (
                            <Box
                              component="img"
                              src={p.image}
                              alt={p.name}
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <ImageNotSupportedIcon sx={{ fontSize: 40, color: '#bbb' }} />
                            </Box>
                          )}
                        </Box>

                        {/* Info area */}
                        <Box sx={{ p: 1 }}>
                          <Typography variant="body2" fontWeight="bold" noWrap title={p.name}>
                            {p.name}
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            ₱{p.price.toFixed(2)}
                          </Typography>
                          <Chip
                            label={`Stock: ${p.quantity}`}
                            size="small"
                            color={p.quantity <= 10 ? 'warning' : 'default'}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
                {filtered.length === 0 && (
                  <Grid item xs={12}>
                    <Typography color="text.secondary" textAlign="center" mt={2}>
                      No products found.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Right — cart */}
        <Grid item xs={12} md={5} sx={{ height: '100%' }}>
          <Paper
            elevation={2}
            sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <Typography variant="h6" fontWeight="bold" mb={1}>
              Cart
            </Typography>

            {/* Scrollable cart items */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 1 }}>
              {cart.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No items in cart. Click a product to add.
                </Typography>
              ) : (
                cart.map((item) => (
                  <Box
                    key={item.productId}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                    gap={1}
                  >
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight="bold" noWrap>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ₱{item.price.toFixed(2)} × {item.quantity}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <IconButton size="small" onClick={() => changeQty(item.productId, -1)}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2">{item.quantity}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => changeQty(item.productId, 1)}
                        disabled={item.quantity >= item.maxStock}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" fontWeight="bold" minWidth={70} textAlign="right">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>

            {/* Fixed bottom: total + cash + checkout */}
            <Box>
              <Divider sx={{ mb: 1 }} />
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  ₱{total.toFixed(2)}
                </Typography>
              </Box>

              <TextField
                label="Cash Tendered (₱)"
                type="number"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 1 }}
                inputProps={{ min: 0, step: 0.01 }}
              />

              {cash && Number(cash) >= total && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Change</Typography>
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    ₱{change.toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<ReceiptIcon />}
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Checkout
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Receipt Dialog */}
      <Dialog open={!!receipt} onClose={() => setReceipt(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>🧾 Receipt</DialogTitle>
        <DialogContent>
          {receipt && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
                mb={2}
              >
                {new Date(receipt.createdAt).toLocaleString()}
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {receipt.items.map((item, i) => (
                <Box key={i} display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">
                    {item.name} × {item.quantity}
                  </Typography>
                  <Typography variant="body2">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography fontWeight="bold">Total</Typography>
                <Typography fontWeight="bold">₱{receipt.total.toFixed(2)}</Typography>
              </Box>
              {receipt.cashGiven > 0 && (
                <>
                  <Box display="flex" justifyContent="space-between" mt={0.5}>
                    <Typography variant="body2">Cash</Typography>
                    <Typography variant="body2">₱{receipt.cashGiven.toFixed(2)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Change</Typography>
                    <Typography variant="body2" color="success.main">
                      ₱{receipt.change.toFixed(2)}
                    </Typography>
                  </Box>
                </>
              )}
              <Typography variant="body2" textAlign="center" mt={2} color="text.secondary">
                Thank you for your purchase!
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" fullWidth onClick={() => setReceipt(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
